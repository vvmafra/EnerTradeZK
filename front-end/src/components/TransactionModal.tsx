
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contract, Transaction } from '../types';
import { useWallet } from '../contexts/WalletContext';
import { executeTransaction } from '../services/dataService';
import { useToast } from '../hooks/use-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  type: 'BUY' | 'SELL';
  defaultPrice?: number;
  defaultQuantity?: number;
  onTransactionComplete?: (transaction: Transaction) => void;
}

const TransactionModal = ({
  isOpen,
  onClose,
  contract,
  type,
  defaultPrice,
  defaultQuantity = 1,
  onTransactionComplete
}: TransactionModalProps) => {
  const [quantity, setQuantity] = useState<number>(defaultQuantity);
  const [price, setPrice] = useState<number>(defaultPrice || (contract?.price || 0));
  const [isProcessing, setIsProcessing] = useState(false);
  const { account } = useWallet();
  const { toast } = useToast();

  const total = quantity * price;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract || !account) return;
    
    try {
      setIsProcessing(true);
      const transaction = await executeTransaction(
        contract.id,
        type,
        quantity,
        price,
        account
      );
      
      toast({
        title: "Transação concluída",
        description: `${type === 'BUY' ? 'Compra' : 'Venda'} de ${quantity} ${quantity > 1 ? 'tokens' : 'token'} realizada com sucesso.`,
      });
      
      if (onTransactionComplete) {
        onTransactionComplete(transaction);
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro na transação",
        description: "Não foi possível completar sua transação.",
        variant: "destructive"
      });
      console.error("Transaction error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-enerTrade-blue border-enerTrade-purple">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {type === 'BUY' ? 'Comprar' : 'Vender'} Energia
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {contract.name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade (kWh)</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                step="1"
                className="bg-enerTrade-darkBlue border-enerTrade-purple"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.01"
                className="bg-enerTrade-darkBlue border-enerTrade-purple"
                required
              />
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex justify-between text-sm pb-1">
              <span className="text-gray-400">Valor estimado:</span>
              <span className="font-medium text-white">R$ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pb-1">
              <span className="text-gray-400">Taxa de plataforma:</span>
              <span className="font-medium text-white">R$ 0,00</span>
            </div>
            <div className="pt-2 border-t border-gray-700 flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-lg">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter className="pt-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              type="button"
              className="border-enerTrade-purple text-white hover:bg-enerTrade-purple/20"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isProcessing || !quantity || !price || price <= 0}
              className={`${
                type === 'BUY' 
                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                  : 'bg-rose-600 hover:bg-rose-500'
              } text-white`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                `${type === 'BUY' ? 'Comprar' : 'Vender'} Energia`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
