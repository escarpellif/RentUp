import { StyleSheet } from 'react-native';

export const categorySubcategoryPickerStyles = StyleSheet.create({
container: {
        marginTop: 20,
        marginBottom: 10,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    picker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
    },
    pickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    pickerIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    pickerText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    pickerArrow: {
        fontSize: 12,
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalClose: {
        fontSize: 24,
        color: '#999',
    },
    modalScroll: {
        paddingHorizontal: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalItemSelected: {
        backgroundColor: '#10B98110',
    },
    modalItemIcon: {
        fontSize: 22,
        marginRight: 12,
    },
    modalItemText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
    },
    modalItemTextSelected: {
        color: '#10B981',
        fontWeight: '600',
    },
    modalItemCheck: {
        fontSize: 18,
        color: '#10B981',
        marginLeft: 10,
    },
});
