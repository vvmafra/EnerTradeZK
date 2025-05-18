import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

interface EnerZBalance {
  amount: string;
  purchasePrice: number;
  currentPrice: number;
}

interface EnerZTransaction {
  type: 'BUY' | 'SELL';
  amount: string;
  price: string;
  timestamp: number;
  total: number;
}

const Wallet = () => {
  const [balance, setBalance] = useState<EnerZBalance>({ amount: '0', purchasePrice: 0, currentPrice: 0 });
  const [transactions, setTransactions] = useState<EnerZTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected, address } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [exchangeBalance, setExchangeBalance] = useState<string>('0');
  const [walletBalance, setWalletBalance] = useState<string>('0');

  const loadUserData = async () => {
    if (!window.ethereum || !address) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Carregar saldo de EnerZ
      const enerzContract = new ethers.Contract(
        CONTRACTS.EnerZ.address,
        CONTRACTS.EnerZ.abi,
        provider
      );

      const balance = await enerzContract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18);
      setWalletBalance(formattedBalance);

      // Carregar transações do Exchange
      const exchangeContract = new ethers.Contract(
        CONTRACTS.Exchange.address,
        CONTRACTS.Exchange.abi,
        provider
      );

      const filter = exchangeContract.filters.ListingSold();
      const events = await exchangeContract.queryFilter(filter);

      const userTransactions = await Promise.all(
        events
          .filter(event => event.args.buyer === address || event.args.seller === address)
          .map(async (event) => {
            const { buyer, seller, amount, price } = event.args;
            const block = await event.getBlock();
            const amountFormatted = ethers.utils.formatUnits(amount, 18);
            const priceFormatted = ethers.utils.formatUnits(price, 6);
            const total = parseFloat(priceFormatted);
            
            return {
              type: buyer === address ? 'BUY' : 'SELL',
              amount: amountFormatted,
              price: priceFormatted,
              timestamp: block.timestamp * 1000,
              total
            };
          })
      );

      // Calcular saldo negociado e preço médio
      let tradedBalance = 0;
      let totalSpent = 0;
      let totalBought = 0;

      userTransactions.forEach(tx => {
        const amount = parseFloat(tx.amount);
        if (tx.type === 'BUY') {
          tradedBalance += amount;
          totalBought += amount;
          totalSpent += tx.total;
        } else {
          tradedBalance -= amount;
        }
      });

      const averagePurchasePrice = totalBought > 0 ? totalSpent / totalBought : 0;

      // Simular preço atual (você pode substituir por uma API de preços real)
      const currentPrice = 0.5; // Exemplo: USDC 1.50 por EnerZ

      setBalance({
        amount: tradedBalance.toString(),
        purchasePrice: averagePurchasePrice,
        currentPrice
      });
      setTransactions(userTransactions as EnerZTransaction[]);

      const exchangeBal = await exchangeContract.getBalance(address);
      setExchangeBalance(ethers.utils.formatUnits(exchangeBal, 18));

      // Total comprado e preço médio de compra
      // const totalBought = transactions
      //   .filter(tx => tx.type === 'BUY')
      //   .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

      // const totalSpent = transactions
      //   .filter(tx => tx.type === 'BUY')
      //   .reduce((acc, tx) => acc + tx.total, 0);

      const avgBuyPrice = totalBought > 0
        ? transactions.filter(tx => tx.type === 'BUY').reduce((acc, tx) => acc + parseFloat(tx.price), 0) / totalBought
        : 0;

      // Total vendido e preço médio de venda
      const totalSold = transactions
        .filter(tx => tx.type === 'SELL')
        .reduce((acc, tx) => acc + parseFloat(tx.amount), 0);

      const totalReceived = transactions
        .filter(tx => tx.type === 'SELL')
        .reduce((acc, tx) => acc + tx.total, 0);

      const avgSellPrice = totalSold > 0
        ? transactions.filter(tx => tx.type === 'SELL').reduce((acc, tx) => acc + parseFloat(tx.price), 0) / totalSold
        : 0;

      const profitLoss = totalReceived - totalSpent;
      const profitLossPercent = totalSpent > 0 ? (profitLoss / totalSpent) * 100 : 0;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Conecte sua carteira para acessar suas informações.",
      });
      return;
    }

    loadUserData();
  }, [connected, address]);

  if (!connected) {
    return null;
  }

  const totalValue = parseFloat(balance.amount) * balance.currentPrice;
  const totalCost = parseFloat(balance.amount) * balance.purchasePrice;
  
  

  const totalBought = transactions.filter(tx => tx.type === 'BUY').reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
  const totalSpent = transactions.filter(tx => tx.type === 'BUY').reduce((acc, tx) => acc + tx.total, 0);
  const avgBuyPrice = totalBought > 0
    ? transactions.filter(tx => tx.type === 'BUY').reduce((acc, tx) => acc + parseFloat(tx.price), 0) / totalBought
    : 0;

  const totalSold = transactions.filter(tx => tx.type === 'SELL').reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
  const totalReceived = transactions.filter(tx => tx.type === 'SELL').reduce((acc, tx) => acc + tx.total, 0);
  const avgSellPrice = totalSold > 0
    ? transactions.filter(tx => tx.type === 'SELL').reduce((acc, tx) => acc + parseFloat(tx.price), 0) / totalSold
    : 0;

  const profitLoss = totalReceived - totalSpent;
  const profitLossPercent = totalSpent > 0 ? (profitLoss / totalSpent) * 100 : 0;

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Minha Carteira EnerZ
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2">
            <div className="glass-panel p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Meus Tokens EnerZ</h2>
              
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 bg-gray-700 rounded-lg" />
                </div>
              ) : (
                <div className="p-4 border border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-400">Saldo Total</div>
                      <div className="font-medium inline-flex items-center">
                        {parseFloat(walletBalance).toFixed(2)}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center"
                        >
                          EnerZ
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">Preço Atual (1 MWh)</div>
                      <div className="font-medium">
                        {balance.currentPrice.toFixed(2)}
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center">
                          USDC
                        </span>
                        {/* <span 
                          className={`ml-2 text-xs ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {profitLoss >= 0 ? '▲' : '▼'} 
                          {Math.abs(profitLossPercent).toFixed(2)}%
                        </span> */}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Total Comprado</div>
                      <div className="font-medium inline-flex items-center">
                        {totalBought.toFixed(2)}
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center">
                          EnerZ
                        </span>
                        {/* <span className="ml-2 text-xs text-gray-400">
                          (Preço médio: USDC {avgBuyPrice.toFixed(2)})
                        </span> */}
                      </div>
                    </div>
                    <div>
                    <div className="text-gray-400">Preço médio de compra</div>
                    <div className="font-medium inline-flex items-center">
                        {avgBuyPrice.toFixed(2)}
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center">
                          USDC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Total Vendido</div>
                      <div className="font-medium inline-flex items-center">
                        {totalSold.toFixed(2)}
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center">
                          EnerZ
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Preço médio de venda</div>
                      <div className="font-medium inline-flex items-center">
                        {avgSellPrice.toFixed(2)}
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center">
                          USDC
                        </span>
                      </div>
                    </div>
                    
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
                    {/* <div className="text-sm">
                      <span className="text-gray-400">Valor Total Negociado:</span>
                      <span className="ml-2 font-medium">
                        USDC {totalValue.toFixed(2)}
                      </span>
                    </div> */}
                    
                    <div className="text-sm">
                      <span className="text-gray-400">Lucro/Prejuízo:</span>
                      <span 
                        className={`ml-2 font-medium ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {profitLoss >= 0 ? '+' : '-'} 
                        {Math.abs(profitLoss).toFixed(2)} USDC
                      </span>
                      <span className={`ml-2 text-xs ${profitLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profitLossPercent >= 0 ? '▲' : '▼'} 
                        {profitLossPercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Histórico de Transações</h2>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 bg-gray-700 rounded-lg" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Você ainda não realizou transações.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {transactions.map((tx, index) => (
                    <div 
                      key={index}
                      className="p-3 border border-gray-700 rounded-lg hover:border-enerTrade-purple/50 transition-colors"
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span 
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              tx.type === 'BUY' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} 
                          />
                          <span className="font-medium">
                            {tx.type === 'BUY' ? 'Compra' : 'Venda'} de {tx.amount} EnerZ
                          </span>
                          <span 
                            className={`ml-3 text-xs px-2 py-1 rounded-full ${
                              tx.type === 'BUY' 
                                ? 'bg-emerald-900/40 text-emerald-300' 
                                : 'bg-rose-900/40 text-rose-300'
                            }`}
                          >
                            {tx.type === 'BUY' ? 'COMPRA' : 'VENDA'}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-gray-400">Preço unitário:</span>
                            <span className="ml-1">
                              {(parseFloat(tx.price) / parseFloat(tx.amount)).toFixed(2)}
                              <span 
                                className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                              >
                                USDC
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Preço total:</span>
                            <span className="ml-1 font-medium">{parseFloat(tx.price).toFixed(2)}
                              <span 
                                className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                              >
                                USDC
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="col-span-1">
            <div className="glass-panel p-6 mb-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Resumo da Carteira</h2>
              
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full bg-gray-700" />
                  <Skeleton className="h-6 w-full bg-gray-700" />
                  <Skeleton className="h-10 w-full bg-gray-700 mt-6" />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="text-gray-400 mb-1">Valor Total de EnerZ na cotação atual</div>
                    <div className="text-2xl font-semibold">{(parseFloat(walletBalance) * (balance.currentPrice)).toFixed(2)} USDC</div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-gray-400 mb-1">Lucro/Prejuízo Negociado</div>
                    <div 
                      className={`text-2xl font-semibold ${
                        profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {profitLoss >= 0 ? '+' : '-'}  {Math.abs(profitLoss).toFixed(2)} USDC
                    </div>
                  </div>
                  
                  <button 
                    className="w-full energy-btn mt-6"
                    onClick={() => navigate('/marketplace')}
                  >
                    Ir para o Marketplace
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
