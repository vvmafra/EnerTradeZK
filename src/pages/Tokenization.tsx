import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

const Tokenization = () => {
  const [priceType, setPriceType] = useState('');
  const [submarket, setSubmarket] = useState('');
  const [energySource, setEnergySource] = useState('');
  const [volume, setVolume] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const { connected } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!connected) {
      navigate('/');
      toast({
        title: "Acesso negado",
        description: "Conecte sua carteira para acessar a tokenização.",
      });
    }
  }, [connected, navigate]);

  const calculateTotalTokens = () => {
    if (!volume || !maturityDate) return;

    const [month, year] = maturityDate.split('/');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const total = parseFloat(volume) * daysInMonth * 24;
    setTotalTokens(total);
  };

  useEffect(() => {
    calculateTotalTokens();
  }, [volume, maturityDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast({
        title: "Carteira não conectada",
        description: "Conecte sua carteira para realizar a tokenização.",
      });
      return;
    }

    try {
      // TODO: Implementar interação com prova ZK e smart contract
      toast({
        title: "Tokenização iniciada",
        description: "Processando sua solicitação...",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar a tokenização.",
        variant: "destructive"
      });
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Tokenização de Energia
        </h1>

        <Card className="glass-panel p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Preço</label>
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de preço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Preço Fixo</SelectItem>
                  <SelectItem value="variable">Preço Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Submercado</label>
              <Select value={submarket} onValueChange={setSubmarket}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o submercado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="southeast">Sudeste</SelectItem>
                  <SelectItem value="south">Sul</SelectItem>
                  <SelectItem value="northeast">Nordeste</SelectItem>
                  <SelectItem value="north">Norte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fonte de Energia</label>
              <Select value={energySource} onValueChange={setEnergySource}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fonte de energia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydro">Hidrelétrica</SelectItem>
                  <SelectItem value="solar">Solar</SelectItem>
                  <SelectItem value="wind">Eólica</SelectItem>
                  <SelectItem value="thermal">Térmica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Volume Negociado (kWh médio/mês)</label>
              <Input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="Digite o volume"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Vencimento (MM/AAAA)</label>
              <Input
                type="text"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                placeholder="MM/AAAA"
                pattern="\d{2}/\d{4}"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total de Tokens</label>
              <div className="p-3 bg-enerTrade-darkBlue rounded-md text-center">
                <span className="text-xl font-semibold">{totalTokens.toLocaleString()} TRON</span>
              </div>
            </div>

            <Button type="submit" className="w-full energy-btn">
              Gerar Tokens
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Tokenization; 