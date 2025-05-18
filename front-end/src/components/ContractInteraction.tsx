import { useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

export const ContractInteraction = () => {
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const { createOffer, isLoading, error } = useContract();
  const { toast } = useToast();

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tx = await createOffer(
        Number(amount),
        parseUnits(price, 18).toString()
      );
      
      toast({
        title: "Oferta criada com sucesso!",
        description: `Transação: ${tx.hash}`,
      });
    } catch (err) {
      toast({
        title: "Erro ao criar oferta",
        description: error || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleCreateOffer} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Quantidade de Tokens</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Digite a quantidade"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Preço em ETH</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Digite o preço"
            step="0.000000000000000001"
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Processando...' : 'Criar Oferta'}
        </Button>
      </form>
    </Card>
  );
}; 