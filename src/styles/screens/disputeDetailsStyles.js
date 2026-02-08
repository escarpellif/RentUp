import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const disputeDetailsStyles = StyleSheet.create({
container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    content: {
        flex: 1,
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    partyRow: {
        marginBottom: 4,
    },
    partyLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    partyValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    partyEmail: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    issueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    issueIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    issueText: {
        fontSize: 16,
        color: '#1F2937',
    },
    observationText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    photoWrapper: {
        width: (SCREEN_WIDTH - 48) / 2,
        height: (SCREEN_WIDTH - 48) / 2,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        alignSelf: 'stretch',
        height: '100%',
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    financeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    financeLabel: {
        fontSize: 15,
        color: '#6B7280',
    },
    financeValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    severityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateRow: {
        marginBottom: 8,
    },
    dateLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 15,
        color: '#1F2937',
    },
    resolveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    resolveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    resolveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: '80%',
    },
});
