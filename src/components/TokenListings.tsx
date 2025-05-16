import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useToast } from '../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CONTRACTS } from '../config/contracts';
import CreateListingModal from './CreateListingModal';

// ABI mínimo para interagir com tokens ERC20
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
  "function decimals() public view returns (uint8)",
  "function transfer(address to, uint256 amount) public returns (bool)"
];

interface Listing {
  id: number;
  seller: string;
  amount: string;
  price: string;
  isActive: boolean;
}

const TokenListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [userBalance, setUserBalance] = useState<string>('0');
  const { connected, address } = useWallet();
  const { toast } = useToast();
  const [loadingBuyId, setLoadingBuyId] = useState<number | null>(null);
  const [loadingCancelId, setLoadingCancelId] = useState<number | null>(null);

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

  const loadListings = async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.Exchange.address,
        CONTRACTS.Exchange.abi,
        provider
      );

      const activeListings = await contract.getActiveListings();
      const listingsData = await Promise.all(
        activeListings.map(async (id: number) => {
          const listing = await contract.listings(id);
          return {
            id: id,
            seller: listing.seller,
            amount: ethers.utils.formatUnits(listing.amount, 18),
            price: ethers.utils.formatUnits(listing.price, 6),
            isActive: listing.isActive
          };
        })
      );

      setListings(listingsData);
    } catch (error) {
      console.error('Erro ao carregar listagens:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as listagens.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadListings();
    if (connected) {
      loadUserBalance();
    }
  }, [connected]);

  const handleBuyListing = async (listingId: number, totalPrice: string) => {
    if (!window.ethereum || !connected) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const exchangeContract = new ethers.Contract(
        CONTRACTS.Exchange.address,
        CONTRACTS.Exchange.abi,
        signer
      );

      const paymentTokenAddress = await exchangeContract.paymentToken();
      const usdcContract = new ethers.Contract(
        paymentTokenAddress,
        ERC20_ABI,
        signer
      );

      const priceWei = ethers.utils.parseUnits(totalPrice, 6);
      const approveTx = await usdcContract.approve(CONTRACTS.Exchange.address, priceWei);
      await approveTx.wait();

      const tx = await exchangeContract.buyListing(listingId);
      await tx.wait();

      toast({
        title: "Sucesso",
        description: "Compra realizada com sucesso!",
      });

      loadListings();
      loadUserBalance();
    } catch (error) {
      console.error('Erro ao comprar listagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a compra. Verifique se você tem USDC suficiente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (listingId: number) => {
    if (!window.ethereum || !connected) return;

    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const exchangeContract = new ethers.Contract(
        CONTRACTS.Exchange.address,
        CONTRACTS.Exchange.abi,
        signer
      );

      const tx = await exchangeContract.cancelListing(listingId);
      await tx.wait();

      toast({
        title: "Sucesso",
        description: "Listagem cancelada com sucesso!",
      });

      loadListings();
      loadUserBalance();
    } catch (error) {
      console.error('Erro ao cancelar listagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a listagem.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (listing: Listing) => {
    setSelectedListing(listing);
    setBuyAmount('');
    setIsBuyModalOpen(true);
  };

  const handleBuyConfirm = async () => {
    if (!selectedListing) return;

    // const amount = parseFloat(selectedListing.amount);
    const totalPrice = (parseFloat(selectedListing.price)).toFixed(6);
    await handleBuyListing(selectedListing.id, totalPrice);
    setIsBuyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Tokens EnerZ</h2>
          {connected && (
            <p className="text-sm text-gray-400">
              Seu saldo: {parseFloat(userBalance).toFixed(2)}
              <span className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center">
                EnerZ
              </span>
            </p>
          )}
        </div>
        {connected ? (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Nova Listagem
          </Button>
        ) : (
          <p className="text-sm text-gray-400">
            Conecte sua carteira para criar listagens
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ordens dos outros */}
        <div>
          <div className="glass-panel rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-enerTrade-purple h-8 w-8 rounded-md flex items-center justify-center mr-3">
                    <span className="font-bold text-xs">EN</span>
                  </div>
                  <h3 className="font-medium text-lg">Ordens Disponíveis</h3>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 font-medium mb-2 bg-enerTrade-darkBlue rounded-md">
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">QTD<br/>TOKENS</div>
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">PREÇO<br/>UNITÁRIO</div>
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">VALOR<br/>TOTAL</div>
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">AÇÃO</div>
              </div>
              <div className="space-y-1">
                {listings.filter(l => l.seller !== address).length === 0 ? (
                  <div className="text-center text-gray-400 py-4">Nenhuma ordem ativa no momento</div>
                ) : (
                  listings.filter(l => l.seller !== address).map((listing) => (
                    <div key={listing.id} className="grid grid-cols-4 text-center py-2 text-sm border-b border-gray-700 items-center">
                      <div className="text-white flex items-center justify-center">
                        {listing.amount}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center"
                        >
                          EnerZ
                        </span>
                      </div>
                      <div className="text-white flex items-center justify-center">
                        {(parseFloat(listing.price) / parseFloat(listing.amount)).toFixed(2)}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                        >
                          USDC
                        </span>
                      </div>
                      <div className="text-white flex items-center justify-center">
                        {listing.price}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                        >
                          USDC
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          className="buy-btn px-3 py-1"
                          onClick={async () => {
                            setLoadingBuyId(listing.id);
                            await handleBuyClick(listing);
                            setLoadingBuyId(null);
                          }}
                          disabled={loadingBuyId === listing.id}
                        >
                          {loadingBuyId === listing.id ? "Processando..." : "Comprar"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Minhas ordens */}
        <div>
          <div className="glass-panel rounded-lg overflow-hidden border-2 border-enerTrade-purple bg-enerTrade-purple/10">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-enerTrade-purple h-8 w-8 rounded-md flex items-center justify-center mr-3">
                  <span className="font-bold text-xs text-white">EN</span>
                </div>
                <h3 className="font-medium text-lg text-enerTrade-purple">Minhas Ordens</h3>
                {/* <span className="ml-3 px-2 py-1 rounded-full bg-enerTrade-purple/30 text-xs text-enerTrade-purple font-bold">MINHA</span> */}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-4 font-medium mb-2 bg-enerTrade-darkBlue rounded-md">
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">QTD<br/>TOKENS</div>
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">PREÇO<br/>UNITÁRIO</div>
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">VALOR<br/>TOTAL</div>
                <div className="py-2 px-1 text-emerald-300 flex items-center justify-center text-center">AÇÃO</div>
              </div>
              <div className="space-y-1">
                {listings.filter(l => l.seller === address).length === 0 ? (
                  <div className="text-center text-gray-400 py-4">Você não possui ordens ativas</div>
                ) : (
                  listings.filter(l => l.seller === address).map((listing) => (
                    <div key={listing.id} className="grid grid-cols-4 text-center py-2 text-sm border-b border-gray-700 items-center">
                      <div className="text-white flex items-center justify-center">{listing.amount}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center"
                        >
                          EnerZ
                        </span>
                      </div>
                      <div className="text-white flex items-center justify-center">
                        {(parseFloat(listing.price) / parseFloat(listing.amount)).toFixed(2)}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                        >
                          USDC
                        </span>
                      </div>
                      <div className="text-white flex items-center justify-center">
                        {listing.price}
                        <span 
                          className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                        >
                          USDC
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          className="text-rose-400 hover:text-rose-600 font-bold text-lg px-2"
                          title="Cancelar ordem"
                          onClick={async () => {
                            setLoadingCancelId(listing.id);
                            await handleCancelListing(listing.id);
                            setLoadingCancelId(null);
                          }}
                          disabled={loadingCancelId === listing.id}
                        >
                          {loadingCancelId === listing.id ? "..." : "✕"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateListingModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadListings();
          loadUserBalance();
        }}
      />

      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Comprar EnerZ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
            <p className="text-sm text-gray-400">
                Quantidade de tokens: {parseFloat(selectedListing?.amount).toFixed(2)}
                <span 
                  className="ml-1 text-xs px-2 py-1 rounded-full bg-purple-900/40 text-purple-300 inline-flex items-center"
                >
                  EnerZ
                </span>
              </p>
              {/* <Input
                type="number"
                value={selectedListing?.amount || ''}
                disabled
                placeholder={`Máximo: ${selectedListing?.amount || 0} EnerZ`}
                min="0"
                max={selectedListing?.amount || 0}
                step="0.01"
              /> */}
              <p className="text-sm text-gray-400">
                Preço por token: {selectedListing ? (parseFloat(selectedListing.price) / parseFloat(selectedListing.amount)).toFixed(2) : 0}
                <span 
                  className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                >
                  USDC
                </span>
              </p>
          
                <p className="text-sm font-medium">
                  Preço total: {selectedListing?.price ? parseFloat(selectedListing.price).toFixed(2) : null}
                  <span 
                    className="ml-1 text-xs px-2 py-1 rounded-full bg-grey-900/40 text-grey-300 inline-flex items-center"
                  >
                    USDC
                  </span>
                </p>
            </div>
            <Button 
              className="w-full" 
              onClick={handleBuyConfirm}
              disabled={loading || !selectedListing}
            >
              {loading ? "Processando..." : "Confirmar Compra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenListings;