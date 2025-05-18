import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Contract } from '../types';
import { getContracts } from '../services/dataService';
import TransactionModal from '../components/TransactionModal';
import { useToast } from '../hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import TokenListings from '../components/TokenListings';

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
        

          <div>
            {/* <h2 className="text-xl font-bold mb-4">Tokens EnerZ</h2> */}
            <TokenListings />
        </div>
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
