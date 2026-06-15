import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ShelloTema } from '../styles/tema';

interface DialogShelloProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
}

export default function DialogShello({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isDestructive = false,
}: DialogShelloProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={estilos.overlay}>
          <TouchableWithoutFeedback>
            <View style={estilos.dialogBox}>
              {/* Ícone opcional baseado no tipo */}
              <View style={[
                estilos.iconWrapper, 
                isDestructive ? estilos.iconDestructive : estilos.iconInfo
              ]}>
                <Feather 
                  name={isDestructive ? 'trash-2' : 'info'} 
                  size={24} 
                  color={isDestructive ? ShelloTema.cores.erro : ShelloTema.cores.marca} 
                />
              </View>

              <Text style={estilos.title}>{title}</Text>
              <Text style={estilos.message}>{message}</Text>

              <View style={estilos.buttonContainer}>
                <TouchableOpacity
                  style={estilos.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={estilos.cancelButtonText}>{cancelLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    estilos.confirmButton,
                    isDestructive ? estilos.confirmButtonDestructive : estilos.confirmButtonNormal
                  ]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={estilos.confirmButtonText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(45, 58, 50, 0.4)', // Fundo escurecido usando a cor do texto principal com transparência
    justifyContent: 'center',
    alignItems: 'center',
    padding: ShelloTema.espacamento.lg,
  },
  dialogBox: {
    backgroundColor: ShelloTema.cores.superficie,
    borderRadius: ShelloTema.forma.bordaMedia,
    width: '100%',
    maxWidth: 320,
    padding: ShelloTema.espacamento.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ShelloTema.espacamento.md,
  },
  iconInfo: {
    backgroundColor: ShelloTema.cores.marcaClaro,
  },
  iconDestructive: {
    backgroundColor: '#FDE8E8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ShelloTema.cores.textoP,
    textAlign: 'center',
    marginBottom: ShelloTema.espacamento.xs,
    fontFamily: 'serif',
  },
  message: {
    fontSize: 14,
    color: ShelloTema.cores.textoS,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: ShelloTema.espacamento.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: ShelloTema.espacamento.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: ShelloTema.espacamento.sm + 4,
    borderRadius: ShelloTema.forma.bordaPill,
    backgroundColor: ShelloTema.cores.fundo,
    borderWidth: 1.5,
    borderColor: ShelloTema.cores.marcaClaro,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShelloTema.cores.textoS,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: ShelloTema.espacamento.sm + 4,
    borderRadius: ShelloTema.forma.bordaPill,
    alignItems: 'center',
  },
  confirmButtonNormal: {
    backgroundColor: ShelloTema.cores.marca,
  },
  confirmButtonDestructive: {
    backgroundColor: ShelloTema.cores.erro,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
