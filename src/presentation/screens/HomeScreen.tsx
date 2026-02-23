import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Shield } from 'lucide-react-native';

// Import existing UI components
import { VaultGrid } from '../components/home/VaultGrid';
import { AnalyticsCards } from '../components/home/AnalyticsCards';
import { ActivityFeed } from '../components/home/ActivityFeed';
import { QuickActions } from '../components/home/QuickActions';
import { DateFilterDropdown, DATE_FILTER_OPTIONS } from '../components/home/DateFilterDropdown';
import VaultUnlockModal from '../component/vault_access/VaultUnlockModal';
import { VaultMembership, VaultService, transformActivity } from '../../service/VaultService';
import { MockDataService } from '../../service/MockDataService';
import { ActivityLog } from '../../types/ActivityTypes';
import BiometricUnlockModal from '../component/modals/BiometricUnlockModal';
import CustomModal from '../component/modals/CustomModal';
import { MOCK_MODE } from '../../config/env';

export default function HomeScreen({
  isConnected = true,
  vaultStatus = 'locked',
  setVaultStatus = () => {},
  hasActiveAlarm = false,
  setHasActiveAlarm = () => {},
  onNavigateToSettings,
  onNavigateToActivity,
}: any) {
  const navigation = useNavigation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState(DATE_FILTER_OPTIONS[0]);
  const [selectedVault, setSelectedVault] = useState<VaultMembership | null>(null);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [selectedRemoteVault, setSelectedRemoteVault] = useState<VaultMembership | null>(null);
  const [addVaultModalVisible, setAddVaultModalVisible] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');

  const [metrics, setMetrics] = useState<any>(null);
  const [vaults, setVaults] = useState<VaultMembership[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  const loadData = useCallback(async () => {
    if (MOCK_MODE) {
      const [v, a] = await Promise.all([
        MockDataService.getVaults(),
        MockDataService.getActivityLogs(),
      ]);
      setMetrics(MockDataService.getMetrics());
      setVaults(v);
      setActivity(a.slice(0, 3));
      return;
    }
    // Real API path
    try {
      const vaults = await VaultService.getUserVaults();
      const mappedVaults = vaults.map(v => ({
        vault_id: v.vault_id,
        vault_name: v.vault_name ?? `UNIT-${v.vault_id}`,
        vault_device_id: null,
        vault_location: null,
        role: (['OWNER', 'ADMIN'].includes((v.role as string).toUpperCase()) ? 'admin' : 'member') as 'admin' | 'member' | 'guest',
        created_at: new Date().toISOString(),
        last_accessed_at: (v as any).last_seen_at ?? null,
      }));
      setVaults(mappedVaults);
      setMetrics({ totalVaults: mappedVaults.length, todayAccessCount: 0, successRate: 0, failedAttempts: 0, lastActivity: null, isLoading: false, error: null });

      if (mappedVaults.length > 0) {
        try {
          const entries = await VaultService.getVaultActivity(String(mappedVaults[0].vault_id), 10);
          setActivity(entries.slice(0, 3).map(transformActivity));
        } catch {
          setActivity([]);
        }
      }
    } catch (e) {
      console.error('HomeScreen: loadData failed', e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleVaultPress = (vault: any) => {
    console.log('🏠 HomeScreen: Selected vault:', vault.vault_name);
    setSelectedVault(vault);
    setUnlockModalVisible(true);
  };

  const handleUnlockVault = async (vault: VaultMembership, pin: string) => {
    if (!MOCK_MODE) {
      try {
        await VaultService.unlockWithPin(String(vault.vault_id), pin);
        Alert.alert('Access Granted', `${vault.vault_name} unlocked.`);
        await loadData();
      } catch (e) {
        Alert.alert('Unlock Failed', e instanceof Error ? e.message : 'Could not unlock vault.');
      }
      return;
    }
    // Existing mock path
    const ts = new Date().toISOString();
    console.log(`\n[SmartVault] ${ts} | INFO  | AUTH  | POST /api/v1/auth/verify-pin | vault_id=${vault.vault_id} | user=johng | status=200 OK`);
    console.log(`[SmartVault] ${ts} | INFO  | VAULT | POST /api/v1/vaults/${vault.vault_id}/unlock | vault=${vault.vault_name ?? `UNIT-${vault.vault_id}`} | method=PIN | status=200 OK | result=ACCESS_GRANTED\n`);
    await MockDataService.addActivityLog({
      id: Date.now().toString(),
      status: 'success',
      eventType: 'remote_unlock',
      title: 'REMOTE UNLOCK',
      description: `PIN verified. ${vault.vault_name || `UNIT-${vault.vault_id}`} access granted remotely.`,
      timestamp: 'Just now',
      user: { initials: 'JG', name: 'J. GABRIELLE' },
    });
    Alert.alert('Unlock request', `Unlock request sent for ${vault.vault_name || `UNIT-${vault.vault_id}`}.`);
  };

  const handleAddVault = async () => {
    const name = newVaultName.trim();
    if (!name) return;
    if (!MOCK_MODE) {
      try {
        await VaultService.createVault({ vault_name: name });
        setAddVaultModalVisible(false);
        setNewVaultName('');
        await loadData();
      } catch (e) {
        Alert.alert('Failed', e instanceof Error ? e.message : 'Could not create vault.');
      }
      return;
    }
    const mockVault: VaultMembership = {
      vault_id: Date.now(),
      vault_name: name,
      vault_device_id: null,
      vault_location: null,
      role: 'admin',
      created_at: new Date().toISOString(),
      last_accessed_at: null,
    };
    setVaults(prev => [...prev, mockVault]);
    MockDataService.addVault(mockVault);
    setAddVaultModalVisible(false);
    setNewVaultName('');
  };

  const renderHeader = () => (
    <View className="px-6 pt-12 bg-bg-default">
      {/* Hero Section */}
      <View className="mb-12">
        <View className="flex-row items-center justify-between">
            <View>
                <Text className="text-zinc-600 text-[10px] font-black uppercase tracking-[5px] mb-1">
                    System.Status.v2
                </Text>
                <Text className="text-white text-5xl font-black tracking-tighter leading-[48px]">
                    DASHBOARD
                </Text>
            </View>
            <View className="w-14 h-14 bg-white rounded-[20px] items-center justify-center shadow-2xl">
                <Shield size={28} color="black" strokeWidth={2.5} />
            </View>
        </View>
        
        <View className="flex-row items-center gap-2 mt-6 p-3 bg-zinc-950 border border-zinc-900 rounded-2xl self-start">
            <View className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white shadow-[0_0_10px_white]' : 'bg-zinc-700'} animate-pulse`} />
            <Text className="text-white text-[10px] font-black uppercase tracking-widest ml-1">
                {isConnected ? 'Network: Active' : 'Network: Offline'}
            </Text>
        </View>
      </View>

      {/* Primary Metrics */}
      <View className="mb-12">
        <AnalyticsCards
            metrics={metrics ?? { totalVaults: 0, todayAccessCount: 0, successRate: 0, failedAttempts: 0, lastActivity: null, isLoading: !metrics, error: null }}
            onRefresh={refreshData}
            isRefreshing={isRefreshing}
        />
      </View>

      {/* Vault Units */}
      <View className="mb-12">
        <VaultGrid
            vaults={vaults as any}
            onVaultPress={handleVaultPress}
            isLoading={vaults.length === 0}
            onAddVault={() => {
              setNewVaultName('');
              setAddVaultModalVisible(true);
            }}
        />
      </View>

      {/* Control Shortcuts */}
      <View className="mb-12">
        <QuickActions
            onRemoteUnlock={() => {
              if (!vaults[0]) {
                Alert.alert('No Vault', 'No vault available for remote unlock.');
                return;
              }
              setSelectedRemoteVault(vaults[0]);
              setBiometricModalVisible(true);
            }}
            onClearAlarm={() => Alert.alert('Command', 'Alarm buffer cleared.')}
            onSettings={() => navigation.navigate('Settings' as never)}
            isConnected={isConnected}
            vaultStatus={vaultStatus}
            hasActiveAlarm={hasActiveAlarm}
            isUnlocking={false}
            isClearingAlarm={false}
        />
      </View>

      {/* Log Feed */}
      <View className="mb-12">
        <ActivityFeed
            activities={activity as any}
            onViewAll={() => navigation.navigate('Activity' as never)}
            onRefresh={refreshData}
            isLoading={activity.length === 0}
            isRefreshing={isRefreshing}
        />
      </View>

      {/* Safety Info Footer */}
      <View className="mb-24 px-2 items-center">
         <View className="w-8 h-[1px] bg-zinc-800 mb-4" />
         <Text className="text-zinc-700 text-[9px] font-black uppercase tracking-[3px] text-center">
            Secured via RSA-4096 Protocol • v2.4.0
         </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-bg-default">
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#FFFFFF']}
            tintColor="#FFFFFF"
            progressBackgroundColor="#000000"
          />
        }
      />

      <VaultUnlockModal
        visible={unlockModalVisible}
        vault={selectedVault}
        onClose={() => setUnlockModalVisible(false)}
        onUnlock={handleUnlockVault}
      />
      <BiometricUnlockModal
        visible={biometricModalVisible}
        onClose={() => setBiometricModalVisible(false)}
        vaultName={selectedRemoteVault?.vault_name ?? 'Main Vault'}
        vaultId={String(selectedRemoteVault?.vault_id ?? '')}
      />
      <CustomModal
        visible={addVaultModalVisible}
        onClose={() => setAddVaultModalVisible(false)}
        title="Add Vault"
        primaryAction={{
          label: 'Add Vault',
          onPress: handleAddVault,
          disabled: !newVaultName.trim(),
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: () => setAddVaultModalVisible(false),
        }}
      >
        <View>
          <Text className="text-zinc-400 text-[10px] font-black uppercase tracking-[2px] mb-2">
            Vault Name
          </Text>
          <TextInput
            value={newVaultName}
            onChangeText={setNewVaultName}
            placeholder="e.g. Home Office Vault"
            placeholderTextColor="#52525B"
            className="bg-zinc-900 text-white px-4 py-4 rounded-2xl border border-zinc-800 text-base"
          />
        </View>
      </CustomModal>
    </View>
  );
}

