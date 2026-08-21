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
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        accounts: {
          create: [
            { accountNumber: `CHK-${Math.floor(10000 + Math.random() * 90000)}`, accountType: 'CHECKING', balance: 1000.0 },
            { accountNumber: `SAV-${Math.floor(10000 + Math.random() * 90000)}`, accountType: 'SAVINGS', balance: 0.0 }
          ]
        }
      },
      include: { accounts: true }
    });

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email } });
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
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- PROTECTED ROUTES ---

// Get user accounts
app.get('/api/accounts', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.id }
    });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Transfer funds
app.post('/api/transactions/transfer', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { fromAccountId, toAccountNumber, amount } = req.body;
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
          category: 'TRANSFER',
          status: 'COMPLETED',
          description: `Transfer to ${toAccount.accountNumber}`
        }
      });
      await tx.transaction.create({
        data: {
          accountId: toAccount.id,
          type: 'TRANSFER_IN',
          amount: parsedAmount,
          category: 'TRANSFER',
          status: 'COMPLETED',
          description: `Transfer from ${fromAccount.accountNumber}`
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get beneficiaries
app.get('/api/beneficiaries', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId: req.user!.id }
    });
    res.status(200).json(beneficiaries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch beneficiaries' });
  }
});

// Add beneficiary
app.post('/api/beneficiaries', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, accountNumber } = req.body;
  if (!name || !accountNumber) {
    res.status(400).json({ error: 'Missing details' });
    return;
  }
  try {
    const beneficiary = await prisma.beneficiary.create({
      data: { userId: req.user!.id, name, accountNumber }
    });
    res.status(201).json(beneficiary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add beneficiary' });
  }
});

// Get loans
app.get('/api/loans', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user!.id }
    });
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// Apply for loan
app.post('/api/loans/apply', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount } = req.body;
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }
  try {
    const loan = await prisma.loan.create({
      data: { userId: req.user!.id, amount: parsedAmount }
    });
    res.status(201).json({ message: 'Loan application submitted', loan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to apply for loan' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
