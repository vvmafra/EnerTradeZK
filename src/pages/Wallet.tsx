
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getUserTokens, getUserTransactions } from '../services/dataService';
import { UserToken, Transaction } from '../types';
import { useToast } from '../hooks/use-toast';
import TransactionModal from '../components/TransactionModal';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const Wallet = () => {
  const [userTokens, setUserTokens] = useState<UserToken[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<UserToken | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { account, connected } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Conecte sua carteira para acessar suas informações.",
      });
      return;
    }

    const loadUserData = async () => {
      if (!account) return;
      
      try {
        setLoading(true);
        const [tokens, transactions] = await Promise.all([
          getUserTokens(account),
          getUserTransactions(account)
        ]);
        
        setUserTokens(tokens);
        setUserTransactions(transactions);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive"
        });
        console.error("Failed to load user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [account, connected, navigate]);

  const handleSellToken = (token: UserToken) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
  };

  const calculateTotalValue = (tokens: UserToken[]) => {
    return tokens.reduce((sum, token) => sum + (token.currentPrice * token.quantity), 0);
  };

  const calculateProfit = (tokens: UserToken[]) => {
    return tokens.reduce((sum, token) => {
      const currentValue = token.currentPrice * token.quantity;
      const purchaseValue = token.purchasePrice * token.quantity;
      return sum + (currentValue - purchaseValue);
    }, 0);
  };

  if (!connected || !account) {
    return null; // Will redirect via useEffect
  }

  const totalValue = calculateTotalValue(userTokens);
  const totalProfit = calculateProfit(userTokens);

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Minha Carteira
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2">
            <div className="glass-panel p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Tokens de Energia</h2>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border border-gray-700 rounded-lg">
                      <Skeleton className="h-6 w-2/3 bg-gray-700 mb-3" />
                      <div className="grid grid-cols-3 gap-4">
                        <Skeleton className="h-5 w-full bg-gray-700" />
                        <Skeleton className="h-5 w-full bg-gray-700" />
                        <Skeleton className="h-5 w-full bg-gray-700" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : userTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Você ainda não possui tokens de energia.</p>
                  <button 
                    className="mt-4 energy-btn"
                    onClick={() => navigate('/marketplace')}
                  >
                    Comprar Energia
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userTokens.map((token) => {
                    const profitLoss = token.currentPrice - token.purchasePrice;
                    const profitLossPercent = (profitLoss / token.purchasePrice) * 100;
                    
                    return (
                      <div 
                        key={token.id} 
                        className="p-4 border border-gray-700 rounded-lg hover:border-enerTrade-purple/50 transition-colors"
                      >
                        <div className="flex justify-between mb-3">
                          <h3 className="font-medium">{token.contractName}</h3>
                          <button 
                            className="text-rose-500 text-sm hover:text-rose-400"
                            onClick={() => handleSellToken(token)}
                          >
                            Vender
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Quantidade</div>
                            <div className="font-medium">{token.quantity} kWh</div>
                          </div>
                          
                          <div>
                            <div className="text-gray-400">Preço de Compra</div>
                            <div className="font-medium">R$ {token.purchasePrice.toFixed(2)}</div>
                          </div>
                          
                          <div>
                            <div className="text-gray-400">Preço Atual</div>
                            <div className="font-medium">
                              R$ {token.currentPrice.toFixed(2)}
                              <span 
                                className={`ml-2 text-xs ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                              >
                                {profitLoss >= 0 ? '▲' : '▼'} 
                                {Math.abs(profitLossPercent).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between">
                          <div className="text-sm">
                            <span className="text-gray-400">Valor Total:</span>
                            <span className="ml-2 font-medium">
                              R$ {(token.currentPrice * token.quantity).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-gray-400">Lucro/Prejuízo:</span>
                            <span 
                              className={`ml-2 font-medium ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                            >
                              {profitLoss >= 0 ? '+' : '-'} 
                              R$ {Math.abs(profitLoss * token.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="glass-panel p-6">
              <h2 className="text-xl font-semibold mb-4">Histórico de Transações</h2>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 border border-gray-700 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <Skeleton className="h-5 w-1/3 bg-gray-700" />
                        <Skeleton className="h-5 w-1/4 bg-gray-700" />
                      </div>
                      <Skeleton className="h-4 w-2/3 bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : userTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Você ainda não realizou transações.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {userTransactions.map((tx) => (
                    <div 
                      key={tx.id} 
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
                            {tx.type === 'BUY' ? 'Compra' : 'Venda'} de {tx.quantity} kWh
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
                        <div className="text-gray-400">
                          {tx.contractName}
                        </div>
                        <div className="flex justify-between mt-1">
                          <div>
                            <span className="text-gray-400">Preço:</span>
                            <span className="ml-1">R$ {tx.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total:</span>
                            <span className="ml-1 font-medium">R$ {tx.total.toFixed(2)}</span>
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
                    <div className="text-gray-400 mb-1">Valor Total em Tokens</div>
                    <div className="text-2xl font-semibold">R$ {totalValue.toFixed(2)}</div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-gray-400 mb-1">Lucro/Prejuízo Total</div>
                    <div 
                      className={`text-2xl font-semibold ${
                        totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {totalProfit >= 0 ? '+' : '-'} R$ {Math.abs(totalProfit).toFixed(2)}
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
      
      {selectedToken && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          contract={{
            id: selectedToken.id,
            name: selectedToken.contractName,
            price: selectedToken.currentPrice,
            maxPrice: selectedToken.currentPrice,
            minPrice: selectedToken.currentPrice,
            month: selectedToken.contractName.split('/')[0].split(' ').pop() || '',
            year: selectedToken.contractName.split('/')[1].split(' ')[0] || '',
            variation: 0,
            buyOffers: [],
            sellOffers: []
          }}
          type="SELL"
          defaultQuantity={selectedToken.quantity}
          defaultPrice={selectedToken.currentPrice}
        />
      )}
    </div>
  );
};

export default Wallet;
