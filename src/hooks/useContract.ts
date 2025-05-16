import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/config/contracts';
import { useWallet } from '@/contexts/WalletContext';

export const useContract = () => {
  const { provider, signer } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => {
    if (!provider || !signer) {
      throw new Error('Carteira não conectada');
    }
    return new ethers.Contract(
      CONTRACTS.EnerZ.address,
      CONTRACTS.EnerZ.abi,
      signer
    );
  }, [provider, signer]);

  const createOffer = useCallback(async (amount: number, priceInWei: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const contract = getContract();
      const tx = await contract.createOffer(amount, priceInWei);
      await tx.wait();
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar oferta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const acceptOffer = useCallback(async (offerId: number, priceInWei: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const contract = getContract();
      const tx = await contract.acceptOffer(offerId, { value: priceInWei });
      await tx.wait();
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar oferta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const cancelOffer = useCallback(async (offerId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const contract = getContract();
      const tx = await contract.cancelOffer(offerId);
      await tx.wait();
      return tx;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar oferta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getOffer = useCallback(async (offerId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const contract = getContract();
      const offer = await contract.offers(offerId);
      return offer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar oferta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  const getOfferCount = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const contract = getContract();
      const count = await contract.offerCount();
      return count;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar contagem de ofertas');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContract]);

  return {
    createOffer,
    acceptOffer,
    cancelOffer,
    getOffer,
    getOfferCount,
    isLoading,
    error
  };
}; 