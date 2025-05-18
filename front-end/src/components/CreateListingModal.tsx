import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CONTRACTS } from '../config/contracts';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateListingModal = ({ isOpen, onClose, onSuccess }: CreateListingModalProps) => {
  const [amount, setAmount] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');
  const { connected, address } = useWallet();
  const { toast } = useToast();

  const loadUserBalance = async () => {
    if (!window.ethereum || !address) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(
        CONTRACTS.EnerZ.address,
        CONTRACTS.EnerZ.abi,
        provider
      );

      const balance = await tokenContract.balanceOf(address);
      setUserBalance(ethers.utils.formatUnits(balance, 18));
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
    }
  };

  useEffect(() => {
    if (connected) {
      loadUserBalance();
    }
  }, [connected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.ethereum || !connected) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const amountNum = parseFloat(amount);
      const unitPriceNum = parseFloat(unitPrice);

      if (isNaN(amountNum) || isNaN(unitPriceNum) || amountNum <= 0 || unitPriceNum <= 0) {
        toast({
          title: "Erro",
          description: "Por favor, insira valores válidos.",
          variant: "destructive"
        });
        return;
      }

      if (amountNum > parseFloat(userBalance)) {
        toast({
          title: "Erro",
          description: `Você não tem tokens suficientes. Saldo disponível: ${userBalance} EnerZ`,
          variant: "destructive"
        });
        return;
      }

      const tokenContract = new ethers.Contract(
        CONTRACTS.EnerZ.address,
        CONTRACTS.EnerZ.abi,
        signer
      );

      const amountWei = ethers.utils.parseUnits(parseFloat(amount).toFixed(18), 18);

      const totalPrice = parseFloat(amount) * parseFloat(unitPrice);
      const priceWei = ethers.utils.parseUnits(totalPrice.toFixed(6), 6); // Preço unitário em USDC (6 decimais)

      const approveTx = await tokenContract.approve(CONTRACTS.Exchange.address, amountWei);
      await approveTx.wait();

      const exchangeContract = new ethers.Contract(
        CONTRACTS.Exchange.address,
        CONTRACTS.Exchange.abi,
        signer
      );

      const tx = await exchangeContract.createListing(amountWei, priceWei);
      await tx.wait();

      toast({
        title: "Sucesso",
        description: "Listagem criada com sucesso!",
      });

      setAmount('');
      setUnitPrice('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar listagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a listagem.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = amount && unitPrice 
    ? (parseFloat(amount) * parseFloat(unitPrice)).toFixed(2)
    : '0.00';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-enerTrade-darkBlue border border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Criar Nova Listagem</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Quantidade de Tokens EnerZ</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Quantidade de EnerZ"
                min="0"
                step="0.01"
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-sm text-gray-400">
                Saldo disponível: {userBalance} EnerZ
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Preço Unitário (USDC)</label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Preço unitário em USDC"
                min="0"
                step="0.01"
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-300">Resumo da Listagem</p>
                <div className="h-6 w-6 rounded-full bg-enerTrade-purple/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-enerTrade-purple">EN</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Quantidade</span>
                  <span className="text-sm font-medium text-white">{amount} EnerZ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Preço Unitário</span>
                  <span className="text-sm font-medium text-white">USDC {unitPrice}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-300">Valor Total</span>
                    <span className="text-lg font-semibold text-white">USDC {totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
            
          <Button 
            type="submit" 
            className="w-full bg-enerTrade-purple hover:bg-enerTrade-purple/90 text-white font-medium" 
            disabled={loading}
          >
            {loading ? "Processando..." : "Criar Listagem"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingModal; 