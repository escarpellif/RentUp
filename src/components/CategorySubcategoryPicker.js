import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { categoryConfig, categories, subcategories } from '../constants/categoryConfig';

export default function CategorySubcategoryPicker({ 
    selectedCategory, 
    selectedSubcategory, 
    onCategoryChange, 
    onSubcategoryChange 
}) {
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

    const handleCategorySelect = (category) => {
        onCategoryChange(category);
        // Limpar subcategoria quando trocar de categoria
        onSubcategoryChange('');
        setShowCategoryModal(false);
    };

    const handleSubcategorySelect = (subcategory) => {
        onSubcategoryChange(subcategory);
        setShowSubcategoryModal(false);
    };

    const categoryInfo = categoryConfig[selectedCategory] || categoryConfig['Otros'];
    const availableSubcategories = selectedCategory && subcategories[selectedCategory] 
        ? subcategories[selectedCategory] 
        : [];

    return (
        <View style={styles.container}>
            {/* Seletor de Categoria */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Categoría *</Text>
                <TouchableOpacity
                    style={styles.picker}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerIcon}>{categoryInfo.icon}</Text>
                        <Text style={styles.pickerText}>
                            {selectedCategory || 'Seleccionar categoría'}
                        </Text>
                    </View>
                    <Text style={styles.pickerArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Seletor de Subcategoria (só aparece se tiver subcategorias) */}
            {availableSubcategories.length > 0 && (
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Subcategoría</Text>
                    <TouchableOpacity
                        style={styles.picker}
                        onPress={() => setShowSubcategoryModal(true)}
                    >
                        <View style={styles.pickerContent}>
                            <Text style={styles.pickerText}>
                                {selectedSubcategory || 'Seleccionar subcategoría (opcional)'}
                            </Text>
                        </View>
                        <Text style={styles.pickerArrow}>▼</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal de Categorias */}
            <Modal
                visible={showCategoryModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {categories.filter(cat => cat !== 'Todos').map((category) => {
                                const config = categoryConfig[category] || categoryConfig['Otros'];
                                const isSelected = selectedCategory === category;
                                
                                return (
                                    <TouchableOpacity
                                        key={category}
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                        onPress={() => handleCategorySelect(category)}
                                    >
                                        <Text style={styles.modalItemIcon}>{config.icon}</Text>
                                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                            {category}
                                        </Text>
                                        {isSelected && <Text style={styles.modalItemCheck}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal de Subcategorias */}
            <Modal
                visible={showSubcategoryModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSubcategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Subcategoría</Text>
                            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {/* Opção "Nenhuma" */}
                            <TouchableOpacity
                                style={[styles.modalItem, !selectedSubcategory && styles.modalItemSelected]}
                                onPress={() => handleSubcategorySelect('')}
                            >
                                <Text style={[styles.modalItemText, !selectedSubcategory && styles.modalItemTextSelected]}>
                                    Ninguna (categoría general)
                                </Text>
                                {!selectedSubcategory && <Text style={styles.modalItemCheck}>✓</Text>}
                            </TouchableOpacity>
                            
                            {/* Subcategorias */}
                            {availableSubcategories.map((subcategory) => {
                                const isSelected = selectedSubcategory === subcategory;
                                
                                return (
                                    <TouchableOpacity
                                        key={subcategory}
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                        onPress={() => handleSubcategorySelect(subcategory)}
                                    >
                                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                            {subcategory}
                                        </Text>
                                        {isSelected && <Text style={styles.modalItemCheck}>✓</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
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

