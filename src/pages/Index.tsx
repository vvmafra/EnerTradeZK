
import { Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  const { connected, connectWallet, connecting } = useWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-3xl">
        <div className="mb-8 flex justify-center">
          <img 
            src="/lovable-uploads/38030b57-9e65-456b-8225-2d407f583efe.png" 
            alt="EnerTradeZK Logo" 
            className="h-40 w-40 animate-pulse-glow"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 glow-text bg-clip-text text-transparent bg-gradient-to-r from-enerTrade-purple to-enerTrade-neonPurple">
          EnerTradeZK
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-300">
          Plataforma descentralizada de negociação de contratos futuros de energia elétrica
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-panel p-6 text-left">
            <div className="text-enerTrade-lightPurple text-lg font-semibold mb-2">Descentralização</div>
            <p className="text-gray-300 text-sm">
              Negocie energia elétrica sem intermediários, com total autonomia e transparência.
            </p>
          </div>
          
          <div className="glass-panel p-6 text-left">
            <div className="text-enerTrade-lightPurple text-lg font-semibold mb-2">Tokenização</div>
            <p className="text-gray-300 text-sm">
              Cada token representa 1 kWh de energia, facilitando a compra e venda de unidades de energia.
            </p>
          </div>
          
          <div className="glass-panel p-6 text-left">
            <div className="text-enerTrade-lightPurple text-lg font-semibold mb-2">Segurança</div>
            <p className="text-gray-300 text-sm">
              Contratos registrados em blockchain garantem a segurança e confiabilidade das transações.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!connected ? (
            <button 
              onClick={connectWallet} 
              disabled={connecting}
              className="bg-enerTrade-purple hover:bg-enerTrade-lightPurple text-white py-3 px-8 rounded-md text-lg font-medium transition-all duration-300 flex items-center justify-center"
            >
              {connecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Conectando...
                </>
              ) : "Conectar Carteira"}
            </button>
          ) : (
            <Link 
              to="/marketplace"
              className="bg-enerTrade-purple hover:bg-enerTrade-lightPurple text-white py-3 px-8 rounded-md text-lg font-medium transition-all duration-300 flex items-center"
            >
              Acessar Marketplace
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} EnerTradeZK. Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default Index;
