
export interface Contract {
  id: string;
  name: string;
  month: string;
  year: string;
  price: number;
  maxPrice: number;
  minPrice: number;
  variation: number;
  buyOffers: ContractOffer[];
  sellOffers: ContractOffer[];
}

export interface ContractOffer {
  id: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  contractName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  timestamp: Date;
  account: string;
}

export interface UserToken {
  id: string;
  contractName: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
}
