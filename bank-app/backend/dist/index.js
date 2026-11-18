"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("./authMiddleware");
const app = (0, express_1.default)();
let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    let port = process.env.DB_PORT || '5432';
    if (port.startsWith('tcp://')) {
        port = '5432';
    }
    const encodedUser = encodeURIComponent(process.env.DB_USER);
    const encodedPassword = encodeURIComponent(process.env.DB_PASSWORD);
    dbUrl = `postgresql://${encodedUser}:${encodedPassword}@${process.env.DB_HOST}:${port}/${process.env.DB_NAME}?sslmode=verify-full&sslrootcert=./global-bundle.pem`;
    console.log({ "DB_URL_MASKED": dbUrl.replace(encodedPassword, '***') });
}
const prisma = new client_1.PrismaClient(dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined);
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_bank_key';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Root health check for ALB
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'bankapp-backend' });
});
// Health check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'ok', database: 'connected' });
    }
    catch (error) {
        console.error('Database connection failed during health check:', error);
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});
// --- AUTH ROUTES ---
// Register
app.post('/api/auth/register', async (req, res) => {
    const { email, name, password } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'Invalid email or password' });
            return;
        }
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: 'Invalid email or password' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }
    catch {
        res.status(500).json({ error: 'Login failed' });
    }
});
// --- PROTECTED ROUTES ---
// Get user accounts
app.get('/api/accounts', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(accounts);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});
// Create new account
app.post('/api/accounts/create', authMiddleware_1.authenticateToken, async (req, res) => {
    const { accountType, initialDeposit } = req.body;
    const validTypes = ['CHECKING', 'SAVINGS', 'CREDIT', 'VAULT'];
    const type = validTypes.includes(accountType) ? accountType : 'SAVINGS';
    const depositAmount = parseFloat(initialDeposit) || 0;
    try {
        const prefix = type.slice(0, 3).toUpperCase();
        const accNumber = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
        const newAccount = await prisma.account.create({
            data: {
                userId: req.user.id,
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});
// Deposit funds
app.post('/api/accounts/deposit', authMiddleware_1.authenticateToken, async (req, res) => {
    const { accountId, amount, category, description } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid deposit amount or account' });
        return;
    }
    try {
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Deposit failed' });
    }
});
// Withdraw / Pay Bill funds
app.post('/api/accounts/withdraw', authMiddleware_1.authenticateToken, async (req, res) => {
    const { accountId, amount, category, description } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid withdrawal amount or account' });
        return;
    }
    try {
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Withdrawal failed' });
    }
});
// Transfer funds
app.post('/api/transactions/transfer', authMiddleware_1.authenticateToken, async (req, res) => {
    const { fromAccountId, toAccountNumber, amount, category, description } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!fromAccountId || !toAccountNumber || isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid transfer details' });
        return;
    }
    try {
        const fromAccount = await prisma.account.findFirst({
            where: { id: fromAccountId, userId: req.user.id }
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Transfer failed' });
    }
});
// Get transaction history
app.get('/api/transactions/history', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const userAccounts = await prisma.account.findMany({
            where: { userId: req.user.id },
            select: { id: true }
        });
        const accountIds = userAccounts.map(a => a.id);
        const transactions = await prisma.transaction.findMany({
            where: { accountId: { in: accountIds } },
            orderBy: { createdAt: 'desc' },
            include: { account: true }
        });
        res.status(200).json(transactions);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
// Get beneficiaries
app.get('/api/beneficiaries', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const beneficiaries = await prisma.beneficiary.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(beneficiaries);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch beneficiaries' });
    }
});
// Add beneficiary
app.post('/api/beneficiaries', authMiddleware_1.authenticateToken, async (req, res) => {
    const { name, accountNumber } = req.body;
    if (!name || !accountNumber) {
        res.status(400).json({ error: 'Missing name or account number' });
        return;
    }
    try {
        const beneficiary = await prisma.beneficiary.create({
            data: { userId: req.user.id, name, accountNumber }
        });
        res.status(201).json(beneficiary);
    }
    catch (err) {
        const prismaError = err;
        if (prismaError?.code === 'P2002') {
            res.status(400).json({ error: 'Beneficiary with this account number already exists' });
            return;
        }
        res.status(500).json({ error: 'Failed to add beneficiary' });
    }
});
// Delete beneficiary
app.delete('/api/beneficiaries/:id', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.beneficiary.deleteMany({
            where: { id, userId: req.user.id }
        });
        res.status(200).json({ message: 'Beneficiary deleted successfully' });
    }
    catch {
        res.status(500).json({ error: 'Failed to delete beneficiary' });
    }
});
// Get loans
app.get('/api/loans', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const loans = await prisma.loan.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(loans);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
});
// Apply for loan
app.post('/api/loans/apply', authMiddleware_1.authenticateToken, async (req, res) => {
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
                userId: req.user.id,
                amount: parsedAmount,
                interestRate: parsedRate,
                status: 'APPROVED' // Instant approval for clean UX
            }
        });
        // Optionally disburse approved loan amount into primary checking account
        const checkingAccount = await prisma.account.findFirst({
            where: { userId: req.user.id, accountType: 'CHECKING' }
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
    }
    catch {
        res.status(500).json({ error: 'Failed to apply for loan' });
    }
});
// Repay Loan
app.post('/api/loans/:id/pay', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { accountId, amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid repayment amount or account' });
        return;
    }
    try {
        const loan = await prisma.loan.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!loan) {
            res.status(404).json({ error: 'Loan not found' });
            return;
        }
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to repay loan' });
    }
});
// Analytics & Insights Summary
app.get('/api/analytics/summary', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.user.id },
            include: {
                transactions: true
            }
        });
        let totalBalance = 0;
        let totalInflow = 0;
        let totalOutflow = 0;
        const categoryTotals = {};
        accounts.forEach(acc => {
            totalBalance += acc.balance;
            acc.transactions.forEach(tx => {
                if (tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN') {
                    totalInflow += tx.amount;
                }
                else if (tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER_OUT') {
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
    }
    catch {
        res.status(500).json({ error: 'Failed to calculate analytics' });
    }
});
// --- SMART VAULTS / SAVINGS GOALS ROUTES ---
// Get user vaults
app.get('/api/vaults', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const vaults = await prisma.vault.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(vaults);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch vaults' });
    }
});
// Create vault
app.post('/api/vaults', authMiddleware_1.authenticateToken, async (req, res) => {
    const { name, targetAmount, initialDeposit, accountId, category } = req.body;
    const parsedTarget = parseFloat(targetAmount);
    const parsedInitial = parseFloat(initialDeposit) || 0;
    if (!name || isNaN(parsedTarget) || parsedTarget <= 0) {
        res.status(400).json({ error: 'Invalid vault name or target amount' });
        return;
    }
    try {
        let vault;
        if (parsedInitial > 0 && accountId) {
            const account = await prisma.account.findFirst({
                where: { id: accountId, userId: req.user.id }
            });
            if (!account || account.balance < parsedInitial) {
                res.status(400).json({ error: 'Insufficient funds in selected account for initial deposit' });
                return;
            }
            vault = await prisma.$transaction(async (tx) => {
                await tx.account.update({
                    where: { id: account.id },
                    data: { balance: { decrement: parsedInitial } }
                });
                await tx.transaction.create({
                    data: {
                        accountId: account.id,
                        type: 'WITHDRAWAL',
                        amount: parsedInitial,
                        category: 'SAVINGS',
                        status: 'COMPLETED',
                        description: `Initial funding for vault: ${name}`
                    }
                });
                return await tx.vault.create({
                    data: {
                        userId: req.user.id,
                        name,
                        targetAmount: parsedTarget,
                        currentAmount: parsedInitial,
                        category: category || 'SAVINGS'
                    }
                });
            });
        }
        else {
            vault = await prisma.vault.create({
                data: {
                    userId: req.user.id,
                    name,
                    targetAmount: parsedTarget,
                    currentAmount: 0,
                    category: category || 'SAVINGS'
                }
            });
        }
        res.status(201).json(vault);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create vault' });
    }
});
// Deposit into vault
app.post('/api/vaults/:id/deposit', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { accountId, amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid deposit amount or account' });
        return;
    }
    try {
        const vault = await prisma.vault.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!vault) {
            res.status(404).json({ error: 'Vault not found' });
            return;
        }
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
        });
        if (!account || account.balance < parsedAmount) {
            res.status(400).json({ error: 'Insufficient funds in selected account' });
            return;
        }
        const updatedVault = await prisma.$transaction(async (tx) => {
            await tx.account.update({
                where: { id: account.id },
                data: { balance: { decrement: parsedAmount } }
            });
            await tx.transaction.create({
                data: {
                    accountId: account.id,
                    type: 'WITHDRAWAL',
                    amount: parsedAmount,
                    category: 'SAVINGS',
                    status: 'COMPLETED',
                    description: `Deposit to Vault: ${vault.name}`
                }
            });
            return await tx.vault.update({
                where: { id: vault.id },
                data: { currentAmount: { increment: parsedAmount } }
            });
        });
        res.status(200).json({ message: 'Funds deposited to vault successfully', vault: updatedVault });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to deposit into vault' });
    }
});
// Withdraw from vault
app.post('/api/vaults/:id/withdraw', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { accountId, amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!accountId || isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Invalid withdrawal amount or destination account' });
        return;
    }
    try {
        const vault = await prisma.vault.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!vault) {
            res.status(404).json({ error: 'Vault not found' });
            return;
        }
        if (vault.currentAmount < parsedAmount) {
            res.status(400).json({ error: 'Insufficient balance in vault' });
            return;
        }
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId: req.user.id }
        });
        if (!account) {
            res.status(404).json({ error: 'Destination account not found' });
            return;
        }
        const updatedVault = await prisma.$transaction(async (tx) => {
            await tx.account.update({
                where: { id: account.id },
                data: { balance: { increment: parsedAmount } }
            });
            await tx.transaction.create({
                data: {
                    accountId: account.id,
                    type: 'DEPOSIT',
                    amount: parsedAmount,
                    category: 'SAVINGS',
                    status: 'COMPLETED',
                    description: `Withdrawal from Vault: ${vault.name}`
                }
            });
            return await tx.vault.update({
                where: { id: vault.id },
                data: { currentAmount: { decrement: parsedAmount } }
            });
        });
        res.status(200).json({ message: 'Funds withdrawn from vault successfully', vault: updatedVault });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to withdraw from vault' });
    }
});
// Delete/Close vault (refunds remaining balance)
app.delete('/api/vaults/:id', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const vault = await prisma.vault.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!vault) {
            res.status(404).json({ error: 'Vault not found' });
            return;
        }
        if (vault.currentAmount > 0) {
            const primaryAccount = (await prisma.account.findFirst({
                where: { userId: req.user.id, accountType: 'CHECKING' }
            })) || (await prisma.account.findFirst({
                where: { userId: req.user.id }
            }));
            if (primaryAccount) {
                await prisma.$transaction(async (tx) => {
                    await tx.account.update({
                        where: { id: primaryAccount.id },
                        data: { balance: { increment: vault.currentAmount } }
                    });
                    await tx.transaction.create({
                        data: {
                            accountId: primaryAccount.id,
                            type: 'DEPOSIT',
                            amount: vault.currentAmount,
                            category: 'SAVINGS',
                            status: 'COMPLETED',
                            description: `Refund upon closing Vault: ${vault.name}`
                        }
                    });
                    await tx.vault.delete({ where: { id: vault.id } });
                });
                res.status(200).json({ message: `Vault closed and $${vault.currentAmount.toFixed(2)} refunded to your checking account.` });
                return;
            }
        }
        await prisma.vault.delete({ where: { id: vault.id } });
        res.status(200).json({ message: 'Vault closed successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to close vault' });
    }
});
// --- VIRTUAL & PHYSICAL CARDS ROUTES ---
function generateCardDetails(brand) {
    const prefix = brand === 'MASTERCARD' ? '5425' : '4829';
    let digits = prefix;
    for (let i = 0; i < 12; i++) {
        digits += Math.floor(Math.random() * 10).toString();
    }
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const now = new Date();
    const expMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expYear = String((now.getFullYear() + 3) % 100).padStart(2, '0');
    const expiryDate = `${expMonth}/${expYear}`;
    return { cardNumber: digits, cvv, expiryDate };
}
// Get user cards
app.get('/api/cards', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        let cards = await prisma.card.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'asc' }
        });
        // Auto-provision primary virtual card if none exists yet
        if (cards.length === 0) {
            const user = await prisma.user.findUnique({ where: { id: req.user.id } });
            const { cardNumber, cvv, expiryDate } = generateCardDetails('VISA');
            const defaultCard = await prisma.card.create({
                data: {
                    userId: req.user.id,
                    cardNumber,
                    cardHolder: (user?.name || 'Nova Member').toUpperCase(),
                    expiryDate,
                    cvv,
                    brand: 'VISA',
                    label: 'Nova Infinite Platinum',
                    isFrozen: false,
                    dailyLimit: 2500.0,
                    allowOnline: true,
                    allowInternational: false
                }
            });
            cards = [defaultCard];
        }
        res.status(200).json(cards);
    }
    catch {
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});
// Issue new card
app.post('/api/cards/create', authMiddleware_1.authenticateToken, async (req, res) => {
    const { label, brand, dailyLimit, cardType } = req.body;
    const selectedBrand = brand === 'MASTERCARD' ? 'MASTERCARD' : 'VISA';
    const parsedLimit = parseFloat(dailyLimit) || 2500;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const { cardNumber, cvv, expiryDate } = generateCardDetails(selectedBrand);
        const newCard = await prisma.card.create({
            data: {
                userId: req.user.id,
                cardNumber,
                cardHolder: (user?.name || 'Nova Member').toUpperCase(),
                expiryDate,
                cvv,
                brand: selectedBrand,
                cardType: cardType || 'VIRTUAL',
                label: label || (selectedBrand === 'VISA' ? 'Nova Virtual Visa' : 'Nova Virtual Mastercard'),
                isFrozen: false,
                dailyLimit: parsedLimit,
                allowOnline: true,
                allowInternational: false
            }
        });
        res.status(201).json(newCard);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to issue card' });
    }
});
// Toggle freeze card
app.patch('/api/cards/:id/freeze', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const card = await prisma.card.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!card) {
            res.status(404).json({ error: 'Card not found' });
            return;
        }
        const updated = await prisma.card.update({
            where: { id: card.id },
            data: { isFrozen: !card.isFrozen }
        });
        res.status(200).json({
            message: `Card ${updated.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
            card: updated
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to toggle card freeze' });
    }
});
// Update card settings (daily limit, online, international)
app.patch('/api/cards/:id/settings', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { dailyLimit, allowOnline, allowInternational } = req.body;
    try {
        const card = await prisma.card.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!card) {
            res.status(404).json({ error: 'Card not found' });
            return;
        }
        const updated = await prisma.card.update({
            where: { id: card.id },
            data: {
                ...(dailyLimit !== undefined ? { dailyLimit: parseFloat(dailyLimit) } : {}),
                ...(allowOnline !== undefined ? { allowOnline: Boolean(allowOnline) } : {}),
                ...(allowInternational !== undefined ? { allowInternational: Boolean(allowInternational) } : {})
            }
        });
        res.status(200).json({ message: 'Card settings updated', card: updated });
    }
    catch {
        res.status(500).json({ error: 'Failed to update card settings' });
    }
});
// Terminate card
app.delete('/api/cards/:id', authMiddleware_1.authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const card = await prisma.card.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!card) {
            res.status(404).json({ error: 'Card not found' });
            return;
        }
        await prisma.card.delete({ where: { id: card.id } });
        res.status(200).json({ message: 'Card terminated successfully' });
    }
    catch {
        res.status(500).json({ error: 'Failed to terminate card' });
    }
});
// --- RECIPIENT SEARCH ROUTE ---
app.get('/api/users/search', authMiddleware_1.authenticateToken, async (req, res) => {
    const query = req.query.q;
    if (!query || query.trim().length < 2) {
        res.status(200).json([]);
        return;
    }
    try {
        const accounts = await prisma.account.findMany({
            where: {
                AND: [
                    { userId: { not: req.user.id } },
                    {
                        OR: [
                            { accountNumber: { contains: query.trim(), mode: 'insensitive' } },
                            { user: { name: { contains: query.trim(), mode: 'insensitive' } } },
                            { user: { email: { contains: query.trim(), mode: 'insensitive' } } }
                        ]
                    }
                ]
            },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            take: 5
        });
        const results = accounts.map((a) => ({
            accountNumber: a.accountNumber,
            accountType: a.accountType,
            recipientName: a.user.name,
            email: a.user.email
        }));
        res.status(200).json(results);
    }
    catch {
        res.status(500).json({ error: 'Search failed' });
    }
});
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
