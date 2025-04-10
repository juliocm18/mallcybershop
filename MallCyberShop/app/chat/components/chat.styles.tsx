import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF5F0",
    },
    sidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: width * 0.8,
        backgroundColor: "#FFD3B4",
        zIndex: 100,
        paddingTop: 50,
        paddingHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    closeSidebarButton: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    sidebarTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 30,
        color: "#D45D00",
    },
    userList: {
        marginTop: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        position: 'relative',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    userAvatarText: {
        color: "#5A2E00",
        fontWeight: "bold",
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        color: "#5A2E00",
        fontWeight: '600',
    },
    userStatus: {
        fontSize: 14,
        color: "#8D6E63",
    },
    onlineIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFD3B4',
    },
    chatContainer: {
        flex: 1,
    },
    chatContainerShifted: {
        marginLeft: width * 0.8,
        width: width,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        backgroundColor: "#FFA577",
        borderBottomWidth: 1,
        borderBottomColor: "#FF8C5A",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    messagesList: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        backgroundColor: "#FFF5F0",
    },
    messageRow: {
        flexDirection: "row",
        marginVertical: 8,
        alignItems: 'flex-start',
    },
    myMessageRow: {
        justifyContent: "flex-end",
    },
    otherMessageRow: {
        justifyContent: "flex-start",
    },
    avatarWrapper: {
        justifyContent: 'flex-start',
        marginRight: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#FF8C5A",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#fff",
        fontWeight: "bold",
    },
    messageColumn: {
        maxWidth: '80%',
        flex: 1,
    },
    messageWithTime: {
        flexDirection: 'column',
    },
    messageBubble: {
        maxWidth: "100%",
        padding: 10,
        borderRadius: 10,
        marginBottom: 2,
    },
    myBubble: {
        backgroundColor: "#FFD3B4",
        borderTopRightRadius: 0,
    },
    otherBubble: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 0,
        borderColor: "#FFD3B4",
        borderWidth: 1,
    },
    senderName: {
        fontWeight: "bold",
        fontSize: 12,
        color: "#D45D00",
        marginBottom: 3,
        marginLeft: 5,
    },
    myText: {
        color: "#5A2E00",
    },
    otherText: {
        color: "#5A2E00",
    },
    timeText: {
        fontSize: 10,
        marginHorizontal: 5,
        marginBottom: 5,
    },
    myTimeText: {
        textAlign: 'right',
        color: '#8D6E63',
    },
    otherTimeText: {
        textAlign: 'left',
        color: '#8D6E63',
    },
    inputContainer: {
        flexDirection: "row",
        padding: 10,
        backgroundColor: "#FFE8D9",
        borderTopWidth: 1,
        borderTopColor: "#FFD3B4",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#FFD3B4",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        backgroundColor: "#fff",
        color: "#5A2E00",
    },
    sendButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#FF8C5A",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitleContainer: {
        flex: 1,
        marginHorizontal: 10,
        justifyContent: 'center',
    },
    typingIndicator: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontStyle: 'italic',
        marginTop: 2,
    },
    sendButtonDisabled: {
        backgroundColor: "#FFB38A",
        opacity: 0.7,
    },
    myProfileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        margin: 15,
        marginBottom: 20,
    },
    myProfileAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    myProfileAvatarText: {
        color: "#5A2E00",
        fontWeight: "bold",
        fontSize: 20,
    },
    myProfileInfo: {
        flex: 1,
    },
    myProfileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: "#5A2E00",
    },
    myProfileStatus: {
        fontSize: 14,
        color: "#5A2E00",
    },

});