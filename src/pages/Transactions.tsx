import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getMarketTransactions } from '../services/dataService';
import { Transaction } from '../types';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

interface ExchangeTransaction {
  type: 'BUY' | 'SELL';
  amount: string;
  price: string;
  timestamp: number;
  buyer: string;
  seller: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exchangeTransactions, setExchangeTransactions] = useState<ExchangeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadExchangeTransactions = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.Exchange.address,
        CONTRACTS.Exchange.abi,
        provider
      );

      // Filtrar eventos de ListingSold
      const filter = contract.filters.ListingSold();
      const events = await contract.queryFilter(filter);

      const transactions = await Promise.all(
        events.map(async (event) => {
          const { listingId, buyer, seller, amount, price } = event.args;
          const block = await event.getBlock();
          
          return {
            type: 'BUY',
            amount: ethers.utils.formatUnits(amount, 18),
            price: ethers.utils.formatUnits(price, 6),
            timestamp: block.timestamp * 1000,
            buyer,
            seller
          };
        })
      );

      setExchangeTransactions(transactions as ExchangeTransaction[]);
    } catch (error) {
      console.error('Erro ao carregar transações do Exchange:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as transações do Exchange.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Conecte sua carteira para acessar as transações do mercado.",
      });
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [marketData] = await Promise.all([
          getMarketTransactions(),
          loadExchangeTransactions()
        ]);
        setTransactions(marketData);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as transações.",
          variant: "destructive"
        });
        console.error("Failed to load transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [connected, navigate]);

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Transações do Mercado
        </h1>
        
        {/* Transações do Exchange */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Transações do Exchange</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 bg-gray-700 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-7 text-gray-400 text-sm border-b border-gray-700 pb-2 mb-3">
                <div>Tipo</div>
                <div>Quantidade</div>
                <div>Preço</div>
                <div>Preço Unitário</div>
                <div>Comprador</div>
                <div>Vendedor</div>
                <div className="text-right">Horário</div>
              </div>
              
              {exchangeTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Não há transações disponíveis.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                  {exchangeTransactions.map((tx, index) => (
                    <div 
                      key={index}
                      className="grid grid-cols-7 py-3 text-sm border-b border-gray-700 hover:bg-enerTrade-darkBlue/50 transition-colors"
                    >
                      <div>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            tx.type === 'BUY'
                              ? 'bg-emerald-900/40 text-emerald-300'
                              : 'bg-rose-900/40 text-rose-300'
                          }`}
                        >
                          {tx.type === 'BUY' ? 'Compra' : 'Venda'}
                        </span>
                      </div>
                      <div>{tx.amount} 
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center">
                          EnerZ
                        </span>
                      </div>
                      <div>{(parseFloat(tx.price)).toFixed(2)} <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center">
                          USDC
                        </span></div>
                      <div>
                        {(parseFloat(tx.price) / parseFloat(tx.amount)).toFixed(2)}
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center">
                          USDC
                        </span>
                      </div>
                      <div className="truncate">{tx.buyer}</div>
                      <div className="truncate">{tx.seller}</div>
                      <div className="text-right text-gray-400">
                        {format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transações do Mercado (existente) */}
        {/* <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold mb-4">Transações do Mercado</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-3 border border-gray-700 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-5 w-1/4 bg-gray-700" />
                    <Skeleton className="h-5 w-1/6 bg-gray-700" />
                  </div>
                  <Skeleton className="h-4 w-1/2 bg-gray-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-7 text-gray-400 text-sm border-b border-gray-700 pb-2 mb-3">
                <div className="col-span-2">Contrato</div>
                <div className="text-center">Tipo</div>
                <div className="text-center">Qtd</div>
                <div className="text-center">Preço</div>
                <div className="text-center">Total</div>
                <div className="text-right">Horário</div>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Não há transações disponíveis.</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="grid grid-cols-7 py-3 text-sm border-b border-gray-700 hover:bg-enerTrade-darkBlue/50 transition-colors"
                    >
                      <div className="col-span-2 flex items-center">
                        <div className="bg-enerTrade-purple h-6 w-6 rounded-md flex items-center justify-center mr-2">
                          <span className="font-bold text-xs">EN</span>
                        </div>
                        <div className="truncate">{tx.contractName}</div>
                      </div>
                      
                      <div className="text-center">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            tx.type === 'BUY'
                              ? 'bg-emerald-900/40 text-emerald-300'
                              : 'bg-rose-900/40 text-rose-300'
                          }`}
                        >
                          {tx.type === 'BUY' ? 'C' : 'V'}
                        </span>
                      </div>
                      
                      <div className="text-center">{tx.quantity}</div>
                      
                      <div className="text-center">
                        R$ {tx.price.toFixed(2)}
                      </div>
                      
                      <div className="text-center font-medium">
                        R$ {tx.total.toFixed(2)}
                      </div>
                      
                      <div className="text-right text-gray-400">
                        {format(new Date(tx.timestamp), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default Transactions;
