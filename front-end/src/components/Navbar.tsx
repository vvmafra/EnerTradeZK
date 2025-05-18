
import { useWallet } from '../contexts/WalletContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { account, connected, connectWallet, disconnectWallet, connecting } = useWallet();
  const location = useLocation();

  return (
    <nav className="fixed w-full z-10 top-0 py-3 px-4 md:px-8 glass-panel">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/38030b57-9e65-456b-8225-2d407f583efe.png" 
            alt="EnerTradeZK Logo" 
            className="h-10 w-10 animate-pulse-glow"
          />
          <span className="text-xl font-bold glow-text text-white">EnerTradeZK</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          {connected && (
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/tokenization"
                className={`text-sm font-medium ${
                  location.pathname === '/tokenization' 
                    ? 'text-white border-b-2 border-enerTrade-purple' 
                    : 'text-gray-300 hover:text-white'
                } transition-colors`}
              >
                Tokenização de energia
              </Link>
              <Link 
                to="/marketplace"
                className={`text-sm font-medium ${
                  location.pathname === '/marketplace' 
                    ? 'text-white border-b-2 border-enerTrade-purple' 
                    : 'text-gray-300 hover:text-white'
                } transition-colors`}
              >
                Marketplace
              </Link>
              <Link 
                to="/wallet"
                className={`text-sm font-medium ${
                  location.pathname === '/wallet' 
                    ? 'text-white border-b-2 border-enerTrade-purple' 
                    : 'text-gray-300 hover:text-white'
                } transition-colors`}
              >
                Minha Carteira
              </Link>
              <Link 
                to="/transactions"
                className={`text-sm font-medium ${
                  location.pathname === '/transactions' 
                    ? 'text-white border-b-2 border-enerTrade-purple' 
                    : 'text-gray-300 hover:text-white'
                } transition-colors`}
              >
                Transações
              </Link>
            </div>
          )}
          
          <div>
            {!connected ? (
              <button 
                onClick={connectWallet} 
                disabled={connecting}
                className="bg-enerTrade-purple hover:bg-enerTrade-lightPurple text-white py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center min-w-[160px]"
              >
                {connecting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Conectando...</span>
                  </div>
                ) : "Conectar carteira"}
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-sm bg-enerTrade-darkPurple py-2 px-4 rounded-md">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
                <button 
                  onClick={disconnectWallet}
                  className="bg-transparent border border-enerTrade-purple text-white py-2 px-4 rounded-md hover:bg-enerTrade-purple/20 transition-all duration-300"
                >
                  Desconectar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile navigation for logged in users */}
      {connected && (
        <div className="md:hidden flex justify-center mt-3 pb-1">
          <div className="flex space-x-4">
            <Link 
              to="/marketplace"
              className={`text-xs font-medium ${
                location.pathname === '/marketplace' 
                  ? 'text-white border-b border-enerTrade-purple' 
                  : 'text-gray-300'
              }`}
            >
              Marketplace
            </Link>
            <Link 
              to="/wallet"
              className={`text-xs font-medium ${
                location.pathname === '/wallet' 
                  ? 'text-white border-b border-enerTrade-purple' 
                  : 'text-gray-300'
              }`}
            >
              Carteira
            </Link>
            <Link 
              to="/transactions"
              className={`text-xs font-medium ${
                location.pathname === '/transactions' 
                  ? 'text-white border-b border-enerTrade-purple' 
                  : 'text-gray-300'
              }`}
            >
              Transações
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
