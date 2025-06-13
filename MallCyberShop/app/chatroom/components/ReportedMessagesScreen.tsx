import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ReportedMessage {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  message: {
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
      name: string;
      avatar_url: string;
    };
  };
  // Will be populated separately
  reporterProfile?: {
    name: string;
    avatar_url: string;
  };
}

const ReportedMessagesScreen: React.FC = () => {
  const [reports, setReports] = useState<ReportedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const router = useRouter();

  useEffect(() => {
    fetchReports();
  }, [filter]);
  
  // Function to fetch reporter profiles
  const fetchReporterProfiles = async (reports: ReportedMessage[]) => {
    if (!reports.length) return reports;
    
    // Get unique reporter IDs
    const reporterIds = [...new Set(reports.map(report => report.reporter_id))];
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', reporterIds);
        
      if (error) throw error;
      
      if (profiles) {
        // Create a map of profiles by ID for quick lookup
        const profileMap = profiles.reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {} as Record<string, any>);
        
        // Attach reporter profiles to reports
        return reports.map(report => ({
          ...report,
          reporterProfile: profileMap[report.reporter_id] || null
        }));
      }
      
      return reports;
    } catch (err) {
      console.error('Error fetching reporter profiles:', err);
      return reports;
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('message_reports')
        .select(`
          id,
          message_id,
          reporter_id,
          reason,
          status,
          created_at,
          resolved_at,
          message:messages (
            content,
            created_at,
            user_id,
            profiles:profiles!messages_user_id_fkey (
              name,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filter if not showing all
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        // Fetch reporter profiles and update state
        const reportsWithProfiles = await fetchReporterProfiles(data as unknown as ReportedMessage[]);
        setReports(reportsWithProfiles);
      }
    } catch (err) {
      console.error('Error fetching reported messages:', err);
      setError('No se pudieron cargar los mensajes reportados. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const status = action === 'resolve' ? 'resolved' : 'dismissed';
      
      const { error } = await supabase
        .from('message_reports')
        .update({
          status,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) {
        throw error;
      }

      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status, resolved_at: new Date().toISOString() } 
            : report
        )
      );

      Alert.alert(
        'Éxito', 
        action === 'resolve' 
          ? 'El reporte ha sido marcado como resuelto.' 
          : 'El reporte ha sido descartado.'
      );
    } catch (err) {
      console.error('Error updating report status:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado del reporte. Por favor, intenta de nuevo.');
    }
  };

  const handleDeleteMessage = async (reportId: string, messageId: string) => {
    Alert.alert(
      'Eliminar Mensaje',
      '¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the message
              const { error: deleteError } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

              if (deleteError) {
                throw deleteError;
              }

              // Mark the report as resolved
              const { error: updateError } = await supabase
                .from('message_reports')
                .update({
                  status: 'resolved',
                  resolved_at: new Date().toISOString()
                })
                .eq('id', reportId);

              if (updateError) {
                throw updateError;
              }

              // Update local state
              setReports(prevReports => 
                prevReports.filter(report => report.message_id !== messageId)
              );

              Alert.alert('Éxito', 'El mensaje ha sido eliminado y el reporte marcado como resuelto.');
            } catch (err) {
              console.error('Error deleting message:', err);
              Alert.alert('Error', 'No se pudo eliminar el mensaje. Por favor, intenta de nuevo.');
            }
          }
        }
      ]
    );
  };

  const renderReportItem = ({ item }: { item: ReportedMessage }) => {
    const formattedDate = new Date(item.created_at).toLocaleString();
    
    return (
      <View style={styles.reportItem}>
        <View style={styles.reportHeader}>
          <Text style={styles.reporterName}>
            Reportado por: {item.reporterProfile?.name || 'Usuario ' + item.reporter_id.substring(0, 8)}
          </Text>
          <Text style={styles.reportDate}>{formattedDate}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.messageAuthor}>
            Mensaje de: {item.message?.profiles?.name || 'Usuario desconocido'}
          </Text>
          <Text style={styles.messageContent}>
            {item.message?.content || 'Contenido no disponible'}
          </Text>
          <Text style={styles.messageDate}>
            {new Date(item.message?.created_at).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Motivo del reporte:</Text>
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            item.status === 'pending' ? styles.statusPending :
            item.status === 'resolved' ? styles.statusResolved :
            styles.statusDismissed
          ]}>
            {item.status === 'pending' ? 'Pendiente' :
             item.status === 'resolved' ? 'Resuelto' : 'Descartado'}
          </Text>
        </View>
        
        {item.status === 'pending' && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.resolveButton]}
              onPress={() => handleResolve(item.id, 'resolve')}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Resolver</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dismissButton]}
              onPress={() => handleResolve(item.id, 'dismiss')}
            >
              <Ionicons name="close-circle" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Descartar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteMessage(item.id, item.message_id)}
            >
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Eliminar mensaje</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mensajes Reportados</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
            Pendientes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'resolved' && styles.activeFilter]}
          onPress={() => setFilter('resolved')}
        >
          <Text style={[styles.filterText, filter === 'resolved' && styles.activeFilterText]}>
            Resueltos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'dismissed' && styles.activeFilter]}
          onPress={() => setFilter('dismissed')}
        >
          <Text style={[styles.filterText, filter === 'dismissed' && styles.activeFilterText]}>
            Descartados
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fb8436" />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchReports}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          <Text style={styles.emptyText}>
            {filter === 'pending' 
              ? 'No hay reportes pendientes' 
              : filter === 'all' 
                ? 'No hay reportes de mensajes' 
                : `No hay reportes ${filter === 'resolved' ? 'resueltos' : 'descartados'}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 35,
  },
  header: {
    backgroundColor: '#fb8436',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 4,
  },
  activeFilter: {
    backgroundColor: '#fb8436',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 12,
  },
  reportItem: {
    marginTop: 35,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reporterName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
  },
  messageContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  messageAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  messageContent: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  messageDate: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
  },
  statusContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  statusText: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusPending: {
    backgroundColor: '#FFC107',
    color: '#fff',
  },
  statusResolved: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  statusDismissed: {
    backgroundColor: '#9E9E9E',
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
  },
  dismissButton: {
    backgroundColor: '#9E9E9E',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#fb8436',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ReportedMessagesScreen;
