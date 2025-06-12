import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    color: '#fb8436',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  headerButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 4,
  },
  headerButtonText: {
    fontSize: 12,
    color: '#fb8436',
    marginTop: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    color: '#fb8436',
  },
  backButtonText: {
    color: '#fb8436',
    fontSize: 16,
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  menuButton: {
    padding: 8,
  },
  messageList: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
  },
  participantListContainer: {
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  participantItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    padding: 8,
  },
  selectedParticipant: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  participantAvatarContainer: {
    position: 'relative',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  participantName: {
    marginTop: 4,
    fontSize: 12,
    maxWidth: 60,
    textAlign: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineIndicator: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  drawerUserList: {
    flex: 1,
  },
  drawerUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerUserAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  drawerUserAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  drawerUserName: {
    fontSize: 16,
  },
  drawerUserStatus: {
    fontSize: 12,
    color: '#666',
  },
  drawerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#0084ff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatarContainer: {
    marginHorizontal: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 2,
  },
  messageUserName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  ownMessage: {
    backgroundColor: '#FFA060',
    borderTopRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#666',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  messageOptionsButton: {
    padding: 4,
    marginLeft: 8,
  },
  messageOptionsContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    width: 150,
  },
  ownMessageOptions: {
    right: 0,
    bottom: '100%',
    marginBottom: 8,
  },
  otherMessageOptions: {
    left: 0,
    bottom: '100%',
    marginBottom: 8,
  },
  messageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  messageOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});
