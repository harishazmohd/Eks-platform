import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from './authMiddleware';

const app = express();

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
  let port = process.env.DB_PORT || '5432';
  if (port.startsWith('tcp://')) {
    port = '5432';
  }
  const encodedUser = encodeURIComponent(process.env.DB_USER);
  const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD);
  dbUrl = `postgresql://${encodedUser}:${encodedPassword}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}?sslmode=verify-full&sslrootcert=./global-bundle.pem`;
  console.log({"DB_URL_MASKED": dbUrl.replace(encodedPassword, '***')});
}

const prisma = new PrismaClient(dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined);
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bank_key';

app.use(cors());
app.use(express.json());

// Root health check for ALB
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'bankapp-backend' });
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database connection failed during health check:', error);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  const { email, name, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const checkingAccNum = `CHK-${Math.floor(10000 + Math.random() * 90000)}`;
    const savingsAccNum = `SAV-${Math.floor(10000 + Math.random() * 90000)}`;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        accounts: {
          create: [
            {
              accountNumber: checkingAccNum,
              accountType: 'CHECKING',
              balance: 1500.0,
              transactions: {
                create: {
                  type: 'DEPOSIT',
                  amount: 1500.0,
                  category: 'SALARY',
                  status: 'COMPLETED',
                  description: 'Initial Opening Bonus & Salary Deposit'
                }
              }
            },
            {
              accountNumber: savingsAccNum,
              accountType: 'SAVINGS',
              balance: 500.0,
              transactions: {
                create: {
                  type: 'DEPOSIT',
                  amount: 500.0,
                  category: 'GENERAL',
                  status: 'COMPLETED',
                  description: 'Welcome Savings Reserve'
                }
              }
            }
          ]
        }
      },
      include: { accounts: true }
    });

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- PROTECTED ROUTES ---

// Get user accounts
app.get('/api/accounts', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json(accounts);
  } catch {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create new account
app.post('/api/accounts/create', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { accountType, initialDeposit } = req.body;
  const validTypes = ['CHECKING', 'SAVINGS', 'CREDIT', 'VAULT'];
  const type = validTypes.includes(accountType) ? accountType : 'SAVINGS';
  const depositAmount = parseFloat(initialDeposit) || 0;

  try {
    const prefix = type.slice(0, 3).toUpperCase();
    const accNumber = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newAccount = await prisma.account.create({
      data: {
        userId: req.user!.id,
        accountNumber: accNumber,
        accountType: type,
        balance: depositAmount > 0 ? depositAmount : 0,
        ...(depositAmount > 0 ? {
          transactions: {
            create: {
              type: 'DEPOSIT',
              amount: depositAmount,
              category: 'GENERAL',
              status: 'COMPLETED',
              description: `Initial funding for new ${type} account`
            }
          }
        } : {})
      }
    });

    res.status(201).json(newAccount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Deposit funds
app.post('/api/accounts/deposit', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { accountId, amount, category, description } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Invalid deposit amount or account' });
    return;
  }

  try {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.user!.id }
    });

    if (!account) {
      res.status(404).json({ error: 'Account not found or unauthorized' });
      return;
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { id: account.id },
        data: { balance: { increment: parsedAmount } }
      });

      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: 'DEPOSIT',
          amount: parsedAmount,
          category: category || 'SALARY',
          status: 'COMPLETED',
          description: description || 'Direct Deposit'
        }
      });

      return updated;
    });

    res.status(200).json({ message: 'Deposit successful', account: updatedAccount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Deposit failed' });
  }
});

// Withdraw / Pay Bill funds
app.post('/api/accounts/withdraw', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { accountId, amount, category, description } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Invalid withdrawal amount or account' });
    return;
  }

  try {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.user!.id }
    });

    if (!account) {
      res.status(404).json({ error: 'Account not found or unauthorized' });
      return;
    }

    if (account.balance < parsedAmount) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: parsedAmount } }
      });

      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: 'WITHDRAWAL',
          amount: parsedAmount,
          category: category || 'UTILITIES',
          status: 'COMPLETED',
          description: description || 'Bill Payment / Withdrawal'
        }
      });

      return updated;
    });

    res.status(200).json({ message: 'Withdrawal successful', account: updatedAccount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Transfer funds
app.post('/api/transactions/transfer', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { fromAccountId, toAccountNumber, amount, category, description } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!fromAccountId || !toAccountNumber || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Invalid transfer details' });
    return;
  }

  try {
    const fromAccount = await prisma.account.findFirst({
      where: { id: fromAccountId, userId: req.user!.id }
    });

    if (!fromAccount) {
      res.status(404).json({ error: 'Source account not found or unauthorized' });
      return;
    }

    if (fromAccount.balance < parsedAmount) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }

    const toAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccountNumber }
    });

    if (!toAccount) {
      res.status(404).json({ error: 'Destination account not found' });
      return;
    }

    if (fromAccount.id === toAccount.id) {
      res.status(400).json({ error: 'Cannot transfer to the same account' });
      return;
    }

    // Perform transfer in a transaction
    await prisma.$transaction(async (tx) => {
      // Deduct
      await tx.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: parsedAmount } }
      });
      // Add
      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: parsedAmount } }
      });
      // Record transaction
      await tx.transaction.create({
        data: {
          accountId: fromAccount.id,
          type: 'TRANSFER_OUT',
          amount: parsedAmount,
          category: category || 'TRANSFER',
          status: 'COMPLETED',
          description: description || `Transfer to ${toAccount.accountNumber}`
        }
      });
      await tx.transaction.create({
        data: {
          accountId: toAccount.id,
          type: 'TRANSFER_IN',
          amount: parsedAmount,
          category: category || 'TRANSFER',
          status: 'COMPLETED',
          description: description || `Transfer from ${fromAccount.accountNumber}`
        }
      });
    });

    res.status(200).json({ message: 'Transfer successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Transfer failed' });
  }
});

// Get transaction history
app.get('/api/transactions/history', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userAccounts = await prisma.account.findMany({
      where: { userId: req.user!.id },
      select: { id: true }
    });

    const accountIds = userAccounts.map(a => a.id);

    const transactions = await prisma.transaction.findMany({
      where: { accountId: { in: accountIds } },
      orderBy: { createdAt: 'desc' },
      include: { account: true }
    });

    res.status(200).json(transactions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get beneficiaries
app.get('/api/beneficiaries', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(beneficiaries);
  } catch {
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// Add beneficiary
app.post('/api/beneficiaries', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, accountNumber } = req.body;
  if (!name || !accountNumber) {
    res.status(400).json({ error: 'Missing name or account number' });
    return;
  }
  try {
    const beneficiary = await prisma.beneficiary.create({
      data: { userId: req.user!.id, name, accountNumber }
    });
    res.status(201).json(beneficiary);
  } catch (err: unknown) {
    const prismaError = err as { code?: string };
    if (prismaError?.code === 'P2002') {
      res.status(400).json({ error: 'Beneficiary with this account number already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to add beneficiary' });
  }
});

// Delete beneficiary
app.delete('/api/beneficiaries/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.beneficiary.deleteMany({
      where: { id, userId: req.user!.id }
    });
    res.status(200).json({ message: 'Beneficiary deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete beneficiary' });
  }
});

// Get loans
app.get('/api/loans', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(loans);
  } catch {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Apply for loan
app.post('/api/loans/apply', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, interestRate } = req.body;
  const parsedAmount = parseFloat(amount);
  const parsedRate = parseFloat(interestRate) || 5.0;

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Invalid loan amount' });
    return;
  }
  try {
    const loan = await prisma.loan.create({
      data: {
        userId: req.user!.id,
        amount: parsedAmount,
        interestRate: parsedRate,
        status: 'APPROVED' // Instant approval for clean UX
      }
    });

    // Optionally disburse approved loan amount into primary checking account
    const checkingAccount = await prisma.account.findFirst({
      where: { userId: req.user!.id, accountType: 'CHECKING' }
    });

    if (checkingAccount) {
      await prisma.account.update({
        where: { id: checkingAccount.id },
        data: { balance: { increment: parsedAmount } }
      });
      await prisma.transaction.create({
        data: {
          accountId: checkingAccount.id,
          type: 'DEPOSIT',
          amount: parsedAmount,
          category: 'LOAN_DISBURSEMENT',
          status: 'COMPLETED',
          description: `Instant Loan #${loan.id.slice(0, 8)} Disbursed`
        }
      });
    }

    res.status(201).json({ message: 'Loan approved and disbursed!', loan });
  } catch {
    res.status(500).json({ error: 'Failed to apply for loan' });
  }
});

// Repay Loan
app.post('/api/loans/:id/pay', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { accountId, amount } = req.body;
  const parsedAmount = parseFloat(amount);

  if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Invalid repayment amount or account' });
    return;
  }

  try {
    const loan = await prisma.loan.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!loan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.user!.id }
    });

    if (!account || account.balance < parsedAmount) {
      res.status(400).json({ error: 'Insufficient funds for loan repayment' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: account.id },
        data: { balance: { decrement: parsedAmount } }
      });

      const remainingAmount = Math.max(0, loan.amount - parsedAmount);
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          amount: remainingAmount,
          status: remainingAmount === 0 ? 'PAID' : 'APPROVED'
        }
      });

      await tx.transaction.create({
        data: {
          accountId: account.id,
          type: 'WITHDRAWAL',
          amount: parsedAmount,
          category: 'LOAN_REPAYMENT',
          status: 'COMPLETED',
          description: `Repayment for Loan #${loan.id.slice(0, 8)}`
        }
      });
    });

    res.status(200).json({ message: 'Loan repayment successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to repay loan' });
  }
});

// Analytics & Insights Summary
app.get('/api/analytics/summary', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.id },
      include: {
        transactions: true
      }
    });

    let totalBalance = 0;
    let totalInflow = 0;
    let totalOutflow = 0;
    const categoryTotals: Record<string, number> = {};

    accounts.forEach(acc => {
      totalBalance += acc.balance;
      acc.transactions.forEach(tx => {
        if (tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN') {
          totalInflow += tx.amount;
        } else if (tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER_OUT') {
          totalOutflow += tx.amount;
          const cat = tx.category || 'GENERAL';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
        }
      });
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalOutflow > 0 ? Math.round((amount / totalOutflow) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    res.status(200).json({
      totalBalance,
      totalInflow,
      totalOutflow,
      netSavings: totalInflow - totalOutflow,
      savingsRate: totalInflow > 0 ? Math.max(0, Math.round(((totalInflow - totalOutflow) / totalInflow) * 100)) : 0,
      categoryBreakdown
    });
  } catch {
    res.status(500).json({ error: 'Failed to calculate analytics' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
