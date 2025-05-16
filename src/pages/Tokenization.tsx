import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';

const Tokenization = () => {
  const [priceType, setPriceType] = useState('');
  const [submarket, setSubmarket] = useState('');
  const [energySource, setEnergySource] = useState('');
  const [volume, setVolume] = useState('');
  const [energy, setEnergy] = useState('');
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

  const calculateVolume = () => {
    if (!energy || !maturityDate) {
      setVolume('');
      return;
    }

    const [month, year] = maturityDate.split('/');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const calculatedVolume = parseFloat(energy) / (24 * daysInMonth);
    setVolume(isNaN(calculatedVolume) ? '' : calculatedVolume.toFixed(10));
  };

  useEffect(() => {
    calculateVolume();
  }, [energy, maturityDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !window.ethereum) {
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

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(
        CONTRACTS.EnerZ.address,
        CONTRACTS.EnerZ.abi,
        signer
      );

      const userAddress = await signer.getAddress();
      const balance = await contract.balanceOf(userAddress);
  
      const tx = await contract.mint(await signer.getAddress(), ethers.utils.parseUnits(energy, 18));
      await tx.wait();
      
      toast({
        title: "Tokenização concluída",
        description: "Tokens gerados com sucesso.",
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
                  <SelectItem value="conventional">Convencional</SelectItem>
                  <SelectItem value="conventional-special">Convencional especial</SelectItem>
                  <SelectItem value="incentivated-50">Incentivada 50%</SelectItem>
                  <SelectItem value="incentivated-100">Incentivada 100%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Energia gerada (MWh)</label>
              <Input
                type="number"
                value={energy}
                onChange={(e) => setEnergy(e.target.value)}
                placeholder="Digite a energia"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período de Fornecimento (MM/AAAA)</label>
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
              <label className="text-sm font-medium">Volume Negociado</label>
              <div className="p-3 bg-enerTrade-darkBlue rounded-md text-center">
                <span className="text-xl font-semibold">{volume || '0'} MW médios / mês</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total de Tokens</label>
              <div className="p-3 bg-enerTrade-darkBlue rounded-md text-center">
                <span className="text-xl font-semibold">{energy} EnerZ</span>
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