import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../store';
import { addReaction, editMessage, deleteMessage } from '../store/chatSlice';
import { Message } from '../types';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageActionsProps {
    visible: boolean;
    message: Message | null;
    chatId: string;
    userId: string;
    onClose: () => void;
}

export default function MessageActions({
    visible,
    message,
    chatId,
    userId,
    onClose,
}: MessageActionsProps) {
    const dispatch = useAppDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');

    if (!message) return null;

    const isOwnMessage = message.senderId === userId;

    const handleReaction = async (emoji: string) => {
        await dispatch(addReaction({
            chatId,
            messageId: message.id,
            emoji,
            userId,
        }));
        onClose();
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;

        await dispatch(editMessage({
            chatId,
            messageId: message.id,
            newContent: editText.trim(),
            userId,
        }));
        setIsEditing(false);
        setEditText('');
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Message',
            'Are you sure you want to delete this message?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(deleteMessage({
                            chatId,
                            messageId: message.id,
                            userId,
                        }));
                        onClose();
                    },
                },
            ]
        );
    };

    const startEditing = () => {
        setEditText(message.content);
        setIsEditing(true);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={{
                        backgroundColor: '#1e293b',
                        borderRadius: 16,
                        padding: 20,
                        width: '85%',
                        maxWidth: 340,
                    }}
                >
                    {/* Message Preview */}
                    <View
                        style={{
                            backgroundColor: '#0f172a',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 16,
                        }}
                    >
                        <Text style={{ color: '#94a3b8', fontSize: 14 }} numberOfLines={2}>
                            {message.deleted ? 'This message was deleted' : message.content}
                        </Text>
                    </View>

                    {/* Reactions */}
                    {!message.deleted && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
                                ADD REACTION
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                }}
                            >
                                {EMOJI_LIST.map((emoji) => {
                                    const hasReacted = message.reactions?.[emoji]?.includes(userId);
                                    return (
                                        <TouchableOpacity
                                            key={emoji}
                                            onPress={() => handleReaction(emoji)}
                                            style={{
                                                padding: 8,
                                                borderRadius: 8,
                                                backgroundColor: hasReacted ? '#0ea5e9' : '#0f172a',
                                            }}
                                        >
                                            <Text style={{ fontSize: 24 }}>{emoji}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Edit Mode */}
                    {isEditing && (
                        <View style={{ marginBottom: 16 }}>
                            <TextInput
                                value={editText}
                                onChangeText={setEditText}
                                style={{
                                    backgroundColor: '#0f172a',
                                    color: '#fff',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginBottom: 8,
                                }}
                                multiline
                                autoFocus
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    onPress={() => setIsEditing(false)}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        borderRadius: 8,
                                        backgroundColor: '#334155',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#fff' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleEdit}
                                    style={{
                                        flex: 1,
                                        padding: 12,
                                        borderRadius: 8,
                                        backgroundColor: '#0ea5e9',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Actions */}
                    {!isEditing && !message.deleted && (
                        <View>
                            {isOwnMessage && message.type === 'text' && (
                                <TouchableOpacity
                                    onPress={startEditing}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 12,
                                        borderRadius: 8,
                                        backgroundColor: '#0f172a',
                                        marginBottom: 8,
                                    }}
                                >
                                    <Ionicons name="pencil" size={20} color="#0ea5e9" />
                                    <Text style={{ color: '#fff', marginLeft: 12 }}>Edit Message</Text>
                                </TouchableOpacity>
                            )}

                            {isOwnMessage && (
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 12,
                                        borderRadius: 8,
                                        backgroundColor: '#0f172a',
                                        marginBottom: 8,
                                    }}
                                >
                                    <Ionicons name="trash" size={20} color="#ef4444" />
                                    <Text style={{ color: '#ef4444', marginLeft: 12 }}>Delete Message</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Close Button */}
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            alignItems: 'center',
                            marginTop: 8,
                        }}
                    >
                        <Text style={{ color: '#64748b' }}>Close</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}
