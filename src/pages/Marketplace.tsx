
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Contract } from '../types';
import { getContracts } from '../services/dataService';
import TransactionModal from '../components/TransactionModal';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const Marketplace = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>(undefined);
  const [defaultQuantity, setDefaultQuantity] = useState<number | undefined>(undefined);
  const { connected } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadContracts = async () => {
      try {
        setLoading(true);
        const data = await getContracts();
        setContracts(data);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contratos.",
          variant: "destructive"
        });
        console.error("Failed to load contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, []);

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Conecte sua carteira para acessar o marketplace.",
      });
    }
  }, [connected, navigate]);

  const handleOpenModal = (
    contract: Contract, 
    type: 'BUY' | 'SELL', 
    price?: number,
    quantity?: number
  ) => {
    if (!connected) {
      toast({
        title: "Carteira não conectada",
        description: "Conecte sua carteira para realizar transações.",
      });
      return;
    }
    
    setSelectedContract(contract);
    setTransactionType(type);
    setDefaultPrice(price);
    setDefaultQuantity(quantity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
    setDefaultPrice(undefined);
    setDefaultQuantity(undefined);
  };

  const handleTransactionComplete = () => {
    // In a real app, we would refresh the contracts data
    // For now, let's just close the modal
    handleCloseModal();
  };

  if (!connected) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Marketplace de Energia
        </h1>
        
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="glass-panel p-4">
                <Skeleton className="h-8 w-2/3 bg-gray-700 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-1/3 bg-gray-700" />
                  <Skeleton className="h-5 w-1/4 bg-gray-700" />
                  <Skeleton className="h-5 w-3/4 bg-gray-700" />
                </div>
                <div className="mt-6">
                  <Skeleton className="h-40 w-full bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contracts.map((contract) => (
              <div key={contract.id} className="glass-panel rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-enerTrade-purple h-8 w-8 rounded-md flex items-center justify-center mr-3">
                        <span className="font-bold text-xs">EN</span>
                      </div>
                      <h3 className="font-medium text-lg">{contract.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold">
                        R$ {contract.price.toFixed(2)}
                      </div>
                      <div className={`text-sm ${contract.variation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {contract.variation >= 0 ? '+' : ''}{contract.variation.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-gray-400">MAX</span>
                      <div className="font-medium">R$ {contract.maxPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">MIN</span>
                      <div className="font-medium">R$ {contract.minPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">ULT</span>
                      <div className="font-medium">R$ {contract.price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-5 text-center text-sm font-medium mb-2 bg-enerTrade-darkBlue rounded-md">
                    <div className="py-2 px-1">QTD</div>
                    <div className="py-2 px-1 col-span-2 bg-emerald-900/40 text-emerald-300">COMPRA</div>
                    <div className="py-2 px-1 col-span-2 bg-rose-900/40 text-rose-300">VENDA</div>
                  </div>
                  
                  <div className="space-y-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const buyOffer = contract.buyOffers[index];
                      const sellOffer = contract.sellOffers[index];
                      
                      return (
                        <div key={index} className="grid grid-cols-5 text-center py-2 text-sm border-b border-gray-700">
                          {/* Buy quantity */}
                          <div className="text-emerald-400">
                            {buyOffer?.quantity.toFixed(2) || '-'}
                          </div>
                          
                          {/* Buy price (clickable) */}
                          <div 
                            className="col-span-2 text-emerald-400 cursor-pointer hover:bg-emerald-900/30 py-1 rounded"
                            onClick={() => buyOffer && handleOpenModal(contract, 'BUY', buyOffer.price, buyOffer.quantity)}
                          >
                            {buyOffer ? `R$ ${buyOffer.price.toFixed(2)}` : '-'}
                          </div>
                          
                          {/* Sell price (clickable) */}
                          <div 
                            className="col-span-2 text-rose-400 cursor-pointer hover:bg-rose-900/30 py-1 rounded"
                            onClick={() => sellOffer && handleOpenModal(contract, 'SELL', sellOffer.price, sellOffer.quantity)}
                          >
                            {sellOffer ? `R$ ${sellOffer.price.toFixed(2)}` : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <button 
                      className="buy-btn"
                      onClick={() => handleOpenModal(contract, 'BUY')}
                    >
                      Comprar
                    </button>
                    <button 
                      className="sell-btn"
                      onClick={() => handleOpenModal(contract, 'SELL')}
                    >
                      Vender
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        contract={selectedContract}
        type={transactionType}
        defaultPrice={defaultPrice}
        defaultQuantity={defaultQuantity}
        onTransactionComplete={handleTransactionComplete}
      />
    </div>
  );
};

export default Marketplace;
