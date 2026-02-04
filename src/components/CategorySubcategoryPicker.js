import React, { useState } from 'react';
import {View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { categoryConfig, categories, subcategories } from '../constants/categoryConfig';
import { categorySubcategoryPickerStyles } from '../styles/components/categorySubcategoryPickerStyles';

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
        <View style={categorySubcategoryPickerStyles.container}>
            {/* Seletor de Categoria */}
            <View style={categorySubcategoryPickerStyles.fieldContainer}>
                <Text style={categorySubcategoryPickerStyles.label}>Categoría *</Text>
                <TouchableOpacity
                    style={categorySubcategoryPickerStyles.picker}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <View style={categorySubcategoryPickerStyles.pickerContent}>
                        <Text style={categorySubcategoryPickerStyles.pickerIcon}>{categoryInfo.icon}</Text>
                        <Text style={categorySubcategoryPickerStyles.pickerText}>
                            {selectedCategory || 'Seleccionar categoría'}
                        </Text>
                    </View>
                    <Text style={categorySubcategoryPickerStyles.pickerArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* Seletor de Subcategoria (só aparece se tiver subcategorias) */}
            {availableSubcategories.length > 0 && (
                <View style={categorySubcategoryPickerStyles.fieldContainer}>
                    <Text style={categorySubcategoryPickerStyles.label}>Subcategoría</Text>
                    <TouchableOpacity
                        style={categorySubcategoryPickerStyles.picker}
                        onPress={() => setShowSubcategoryModal(true)}
                    >
                        <View style={categorySubcategoryPickerStyles.pickerContent}>
                            <Text style={categorySubcategoryPickerStyles.pickerText}>
                                {selectedSubcategory || 'Seleccionar subcategoría (opcional)'}
                            </Text>
                        </View>
                        <Text style={categorySubcategoryPickerStyles.pickerArrow}>▼</Text>
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
                <View style={categorySubcategoryPickerStyles.modalOverlay}>
                    <View style={categorySubcategoryPickerStyles.modalContent}>
                        <View style={categorySubcategoryPickerStyles.modalHeader}>
                            <Text style={categorySubcategoryPickerStyles.modalTitle}>Seleccionar Categoría</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Text style={categorySubcategoryPickerStyles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={categorySubcategoryPickerStyles.modalScroll}>
                            {categories.filter(cat => cat !== 'Todos').map((category) => {
                                const config = categoryConfig[category] || categoryConfig['Otros'];
                                const isSelected = selectedCategory === category;
                                
                                return (
                                    <TouchableOpacity
                                        key={category}
                                        style={[categorySubcategoryPickerStyles.modalItem, isSelected && categorySubcategoryPickerStyles.modalItemSelected]}
                                        onPress={() => handleCategorySelect(category)}
                                    >
                                        <Text style={categorySubcategoryPickerStyles.modalItemIcon}>{config.icon}</Text>
                                        <Text style={[categorySubcategoryPickerStyles.modalItemText, isSelected && categorySubcategoryPickerStyles.modalItemTextSelected]}>
                                            {category}
                                        </Text>
                                        {isSelected && <Text style={categorySubcategoryPickerStyles.modalItemCheck}>✓</Text>}
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
                <View style={categorySubcategoryPickerStyles.modalOverlay}>
                    <View style={categorySubcategoryPickerStyles.modalContent}>
                        <View style={categorySubcategoryPickerStyles.modalHeader}>
                            <Text style={categorySubcategoryPickerStyles.modalTitle}>Seleccionar Subcategoría</Text>
                            <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                                <Text style={categorySubcategoryPickerStyles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={categorySubcategoryPickerStyles.modalScroll}>
                            {/* Opção "Nenhuma" */}
                            <TouchableOpacity
                                style={[categorySubcategoryPickerStyles.modalItem, !selectedSubcategory && categorySubcategoryPickerStyles.modalItemSelected]}
                                onPress={() => handleSubcategorySelect('')}
                            >
                                <Text style={[categorySubcategoryPickerStyles.modalItemText, !selectedSubcategory && categorySubcategoryPickerStyles.modalItemTextSelected]}>
                                    Ninguna (categoría general)
                                </Text>
                                {!selectedSubcategory && <Text style={categorySubcategoryPickerStyles.modalItemCheck}>✓</Text>}
                            </TouchableOpacity>
                            
                            {/* Subcategorias */}
                            {availableSubcategories.map((subcategory) => {
                                const isSelected = selectedSubcategory === subcategory;
                                
                                return (
                                    <TouchableOpacity
                                        key={subcategory}
                                        style={[categorySubcategoryPickerStyles.modalItem, isSelected && categorySubcategoryPickerStyles.modalItemSelected]}
                                        onPress={() => handleSubcategorySelect(subcategory)}
                                    >
                                        <Text style={[categorySubcategoryPickerStyles.modalItemText, isSelected && categorySubcategoryPickerStyles.modalItemTextSelected]}>
                                            {subcategory}
                                        </Text>
                                        {isSelected && <Text style={categorySubcategoryPickerStyles.modalItemCheck}>✓</Text>}
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



