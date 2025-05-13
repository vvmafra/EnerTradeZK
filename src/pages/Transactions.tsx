
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getMarketTransactions } from '../services/dataService';
import { Transaction } from '../types';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Conecte sua carteira para acessar as transações do mercado.",
      });
      return;
    }

    const loadTransactions = async () => {
      try {
        setLoading(true);
        const data = await getMarketTransactions();
        setTransactions(data);
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

    loadTransactions();
  }, [connected, navigate]);

  if (!connected) {
    return null; // Will redirect via useEffect
  }

  const groupTransactionsByContract = () => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    transactions.forEach(tx => {
      if (!grouped[tx.contractName]) {
        grouped[tx.contractName] = [];
      }
      grouped[tx.contractName].push(tx);
    });
    
    return grouped;
  };

  const groupedTransactions = groupTransactionsByContract();

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Transações do Mercado
        </h1>
        
        {loading ? (
          <div className="glass-panel p-6">
            <Skeleton className="h-8 w-1/3 bg-gray-700 mb-4" />
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
          </div>
        ) : (
          <div className="glass-panel p-6">
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
                <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
