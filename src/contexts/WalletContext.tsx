import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '../hooks/use-toast';

interface WalletContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connecting: boolean;
  connected: boolean;
  address: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask não encontrada",
        description: "Por favor instale a MetaMask para continuar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnecting(true);
      // Request accounts from MetaMask
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setConnected(true);
      setAddress(account);
      
      toast({
        title: "Carteira conectada",
        description: `Conectado com ${account.slice(0, 6)}...${account.slice(-4)}`,
      });

      // Store connection in local storage
      localStorage.setItem('walletConnected', 'true');

    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Falha na conexão",
        description: "Não foi possível conectar à sua carteira.",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setConnected(false);
    setAddress(null);
    localStorage.removeItem('walletConnected');
    toast({
      title: "Carteira desconectada",
      description: "Sua carteira foi desconectada com sucesso."
    });
  };

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (connected) {
          setAccount(accounts[0]);
          setAddress(accounts[0]);
          toast({
            title: "Conta alterada",
            description: `Agora conectado com ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
          });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [connected]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      
      if (wasConnected && window.ethereum) {
        try {
          setConnecting(true);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            const signer = provider.getSigner();
            const account = accounts[0];
            
            setProvider(provider);
            setSigner(signer);
            setAccount(account);
            setConnected(true);
            setAddress(account);
          } else {
            localStorage.removeItem('walletConnected');
          }
        } catch (error) {
          console.error("Auto-connect error:", error);
          localStorage.removeItem('walletConnected');
        } finally {
          setConnecting(false);
        }
      }
    };
    
    autoConnect();
  }, []);

  return (
    <WalletContext.Provider value={{
      account,
      provider,
      signer,
      connecting,
      connected,
      address,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// Add type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
