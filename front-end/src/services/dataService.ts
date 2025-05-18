
import { Contract, ContractOffer, Transaction, UserToken } from '../types';

// Mock contracts for the marketplace
const mockContracts: Contract[] = [
  {
    id: '1',
    name: 'SE CON MEN MAI/25 - Preço Fixo',
    month: 'MAI',
    year: '25',
    price: 215.00,
    maxPrice: 216.50,
    minPrice: 212.00,
    variation: -1.40,
    buyOffers: [
      { id: 'b1', quantity: 2, price: 213.00 },
      { id: 'b2', quantity: 1, price: 213.00 },
      { id: 'b3', quantity: 2, price: 212.50 },
      { id: 'b4', quantity: 1, price: 212.00 },
      { id: 'b5', quantity: 2, price: 212.00 },
    ],
    sellOffers: [
      { id: 's1', quantity: 5, price: 214.00 },
      { id: 's2', quantity: 1, price: 215.00 },
      { id: 's3', quantity: 5, price: 216.00 },
      { id: 's4', quantity: 2, price: 216.00 },
      { id: 's5', quantity: 1, price: 216.50 },
    ]
  },
  {
    id: '2',
    name: 'SE CON MEN JUN/25 - Preço Fixo',
    month: 'JUN',
    year: '25',
    price: 304.00,
    maxPrice: 306.00,
    minPrice: 300.00,
    variation: 0.00,
    buyOffers: [
      { id: 'b6', quantity: 1, price: 301.00 },
      { id: 'b7', quantity: 1, price: 300.02 },
      { id: 'b8', quantity: 1, price: 300.01 },
      { id: 'b9', quantity: 1, price: 300.00 },
      { id: 'b10', quantity: 2, price: 300.00 },
    ],
    sellOffers: [
      { id: 's6', quantity: 5, price: 304.00 },
      { id: 's7', quantity: 1, price: 304.50 },
      { id: 's8', quantity: 2, price: 304.90 },
      { id: 's9', quantity: 1, price: 305.00 },
      { id: 's10', quantity: 2, price: 305.50 },
    ]
  },
  {
    id: '3',
    name: 'SE CON MEN JUL/25 - Preço Fixo',
    month: 'JUL',
    year: '25',
    price: 335.00,
    maxPrice: 338.50,
    minPrice: 335.00,
    variation: 0.90,
    buyOffers: [
      { id: 'b11', quantity: 2, price: 337.00 },
      { id: 'b12', quantity: 1, price: 336.51 },
      { id: 'b13', quantity: 2, price: 336.50 },
      { id: 'b14', quantity: 1, price: 336.00 },
      { id: 'b15', quantity: 3, price: 334.00 },
    ],
    sellOffers: [
      { id: 's11', quantity: 1, price: 338.00 },
      { id: 's12', quantity: 1, price: 338.50 },
      { id: 's13', quantity: 1, price: 339.00 },
      { id: 's14', quantity: 1, price: 339.00 },
      { id: 's15', quantity: 1, price: 339.00 },
    ]
  }
];

// Mock transactions
const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  // Generate random transactions from the last 24 hours
  for (let i = 0; i < 30; i++) {
    const contract = mockContracts[Math.floor(Math.random() * mockContracts.length)];
    const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const quantity = Math.floor(Math.random() * 5) + 1;
    const price = contract.price + (Math.random() * 4 - 2); // Price with small variation
    
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const timestampDate = new Date(now.getTime() - (hoursAgo * 60 + minutesAgo) * 60000);
    
    transactions.push({
      id: `t${i}`,
      contractName: contract.name,
      type,
      quantity,
      price: Number(price.toFixed(2)),
      total: Number((quantity * price).toFixed(2)),
      timestamp: timestampDate,
      account: `0x${Math.floor(Math.random() * 0xFFFFFFFFFFFFFFFF).toString(16).padStart(16, '0')}`
    });
  }
  
  // Sort by timestamp, newest first
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const mockTransactions = generateMockTransactions();

// Mock user tokens/contracts
const mockUserTokens: UserToken[] = [
  {
    id: 'ut1',
    contractName: 'SE CON MEN MAI/25 - Preço Fixo',
    quantity: 3,
    purchasePrice: 213.50,
    currentPrice: 215.00
  },
  {
    id: 'ut2',
    contractName: 'SE CON MEN JUN/25 - Preço Fixo',
    quantity: 2,
    purchasePrice: 302.75,
    currentPrice: 304.00
  }
];

// User transactions
const mockUserTransactions: Transaction[] = [
  {
    id: 'ut1',
    contractName: 'SE CON MEN MAI/25 - Preço Fixo',
    type: 'BUY',
    quantity: 3,
    price: 213.50,
    total: 640.50,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    account: '0xYourAccount'
  },
  {
    id: 'ut2',
    contractName: 'SE CON MEN JUN/25 - Preço Fixo',
    type: 'BUY',
    quantity: 2,
    price: 302.75,
    total: 605.50,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    account: '0xYourAccount'
  },
  {
    id: 'ut3',
    contractName: 'SE CON MEN JUL/25 - Preço Fixo',
    type: 'SELL',
    quantity: 1,
    price: 337.00,
    total: 337.00,
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    account: '0xYourAccount'
  }
];

export const getContracts = (): Promise<Contract[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockContracts]);
    }, 500);
  });
};

export const getContract = (id: string): Promise<Contract | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockContracts.find(c => c.id === id));
    }, 300);
  });
};

export const getMarketTransactions = (): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockTransactions]);
    }, 500);
  });
};

export const getUserTokens = (account: string): Promise<UserToken[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockUserTokens]);
    }, 300);
  });
};

export const getUserTransactions = (account: string): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Replace account in mock data with actual user account
      const transactions = mockUserTransactions.map(tx => ({
        ...tx,
        account
      }));
      resolve(transactions);
    }, 300);
  });
};

export const executeTransaction = (
  contractId: string,
  type: 'BUY' | 'SELL',
  quantity: number,
  price: number,
  account: string
): Promise<Transaction> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contract = mockContracts.find(c => c.id === contractId);
      if (!contract) throw new Error("Contract not found");
      
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        contractName: contract.name,
        type,
        quantity,
        price,
        total: price * quantity,
        timestamp: new Date(),
        account
      };
      
      resolve(newTransaction);
    }, 1000);
  });
};
