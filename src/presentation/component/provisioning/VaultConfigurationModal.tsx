import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { Shield, Check } from 'lucide-react-native';
import CustomModal from '../modals/CustomModal';
import { useVaultCreation } from '../../screens/settings/hooks/provisioning/useVaultCreation';
import { useAuthContext } from '../../context/AuthContext';
import type { ESPDevice } from '@orbital-systems/react-native-esp-idf-provisioning';
import { SuccessMessage } from '../common/SuccessMessage';

interface VaultConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDevice: ESPDevice | null;
  onVaultCreated: (vaultData: any) => void;
  isCreating?: boolean;
}

const VaultConfigurationModal: React.FC<VaultConfigurationModalProps> = ({
  visible,
  onClose,
  selectedDevice,
  onVaultCreated,
  isCreating = false,
}) => {
  const [vaultName, setVaultName] = useState('');
  const [location, setLocation] = useState('');
  const { createVault } = useVaultCreation();
  const { isAuthenticated } = useAuthContext();

  const handleCreateVault = async () => {
    if (!vaultName.trim()) {
      Alert.alert('Error', 'Please enter a vault name');
      return;
    }

    if (!selectedDevice) {
      Alert.alert('Error', 'No device selected');
      return;
    }

    const vaultData = {
      hardware_uuid: selectedDevice.name,
      vault_name: vaultName.trim(),
    };

    console.log('Creating vault with data:', vaultData);

    const result = await createVault(vaultData);

    if (result) {
      onVaultCreated(result);
      onClose();

      // Reset form
      setVaultName('');
      setLocation('');
    }
    // Error handling is done in the hook
  };

  const handleClose = () => {
    if (!isCreating) {
      setVaultName('');
      setLocation('');
      onClose();
    }
  };

  return (
    <CustomModal
      visible={visible}
      onClose={handleClose}
      title="Configure Vault"
      primaryAction={{
        label: "Create Vault",
        onPress: handleCreateVault,
        disabled: !vaultName.trim() || !isAuthenticated,
        loading: isCreating,
      }}
      secondaryAction={{
        label: "Cancel",
        onPress: handleClose,
      }}
    >
      <View className="mb-4">
        {selectedDevice && (
          <SuccessMessage 
            message={`WiFi Configuration Successful! \n${selectedDevice.name} is now connected.\nNow let's configure your vault settings.`}
          />
        )}

        {/* Authentication check */}
        {!isAuthenticated && (
          <View className="mb-6 p-4 bg-error-light rounded-lg border border-error-DEFAULT">
            <Text className="text-sm font-medium text-error-dark mb-1">
              Authentication Required
            </Text>
            <Text className="text-sm text-error-dark">
              You need to be logged in to create a vault. Please log in and try again.
            </Text>
          </View>
        )}

        {/* Vault Name Input */}
        <View className="mb-4">
          <TextInput
            value={vaultName}
            onChangeText={setVaultName}
            placeholder="Enter vault name (e.g., Office Safe)"
            className="border border-border-dark rounded-2xl px-3 py-3 text-text-dark bg-surface-default"
            placeholderTextColor="#64748b"
            editable={!isCreating}
            maxLength={100}
          />
        </View>

        {/* Location Input */}
        <View className="mb-6"> 
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter vault location (e.g., 2nd Floor Storage)"
            className="border border-border-dark rounded-2xl px-3 py-3 text-text-dark  bg-surface-default"
            placeholderTextColor="#64748b"
            editable={!isCreating}
            maxLength={200}
          />
        </View>

        {/* Info Text */}
        <View className="p-3 bg-surface-default rounded-lg">
          <Text className="text-sm text-muted-default">
            💡 Your vault will be created with the device ID as its unique identifier.
            You'll automatically become the admin of this vault.
          </Text>
        </View>
      </View>
    </CustomModal> 
  );
};

export default VaultConfigurationModal;