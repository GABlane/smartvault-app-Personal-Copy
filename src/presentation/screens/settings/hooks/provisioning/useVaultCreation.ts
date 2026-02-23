import { useState, useCallback } from 'react';
import { VaultService, VaultCreateData, VaultCreationResult } from '../../../../../service/VaultService';
import { useErrorHandler } from '../../../../hooks/common/useErrorHandler';

export const useVaultCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const { handleAPIError } = useErrorHandler();

  const createVault = useCallback(async (vaultData: VaultCreateData): Promise<VaultCreationResult | null> => {
    setIsCreating(true);
    setCreationError(null);

    try {
      const result = await VaultService.createVault(vaultData);
      return result;
    } catch (err) {
      const errorMessage = handleAPIError(err, {
        action: 'Create vault',
        context: `Hardware UUID: ${vaultData.hardware_uuid ?? 'auto'}, Name: ${vaultData.vault_name}`
      }, {
        showAlert: true,
        logError: true,
        fallbackMessage: 'Failed to create vault'
      });
      setCreationError(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [handleAPIError]);

  const resetCreation = useCallback(() => {
    setIsCreating(false);
    setCreationError(null);
  }, []);

  return {
    createVault,
    isCreating,
    creationError,
    resetCreation,
  };
};