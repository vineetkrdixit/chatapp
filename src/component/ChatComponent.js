import React, { useState, useEffect, useCallback } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import { View, Text, TextInput, Button } from 'react-native';
import socket from '../../utils/socket';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
const CHAT_STORAGE_KEY = 'chat_messages'


const ChatComponent = () => {
    const [messages, setMessages] = useState([]);
    const [sockets, setSockets] = useState(null);
    const [userId, setUserId] = useState(''); // To store the socket ID or user ID
    const [username, setUsername] = useState(''); // Current user's name
    const [isUsernameSet, setIsUsernameSet] = useState(false); // Flag to check if username is set

    console.log(messages,"messagesmessages")

    // Function to load messages from AsyncStorage
    const loadMessages = async () => {
        try {
            const storedMessages = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
            if (storedMessages !== null) {
                // Parse the stored messages and set them
                const parsedMessages = JSON.parse(storedMessages);
                // Ensure each message has the correct format before loading into GiftedChat
                setMessages(parsedMessages.map(message => ({
                    ...message,
                    createdAt: new Date(message.createdAt), // Ensure createdAt is a Date object
                })));
            }
        } catch (error) {
            console.error('Error loading chat messages from AsyncStorage:', error);
        }
    };

    // Save messages to AsyncStorage whenever the messages state is updated
    const saveMessages = async (messages) => {
        try {
            // Save the messages as a JSON string
            await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error('Error saving chat messages to AsyncStorage:', error);
        }
    };

    useEffect(() => {
        // Load messages from AsyncStorage when the component mounts
        loadMessages();

        setSockets(socket);

        // Listen for successful connection
        socket.on('connect', () => {
            console.log('Connected to server with socket ID:', socket.id);
            setUserId(socket.id); // Save the socket ID as user ID
        });

        // Listen for incoming messages from the server
        socket.on('message', (message) => {
            console.log(message,"messsages")
            setMessages((prevMessages) => {
                // Ensure that incoming messages have the correct format and unique user ID
                const updatedMessages = GiftedChat.append(prevMessages, {
                    ...message,
                    createdAt: new Date(message.createdAt), // Ensure createdAt is a Date object
                    user: {
                        ...message.user,
                        _id: message.user._id || 'unknown', // Make sure the other user's ID is set correctly
                    },
                });

                // Save updated messages to AsyncStorage
                saveMessages(updatedMessages);

                return updatedMessages;
            });
        });

        // Clean up the socket connection when the component unmounts
        return () => {
            socket.disconnect();
        };
    }, []);


    //   // Function to handle sending messages
    //   const onSend = useCallback((messages = []) => {
    //     // Emit the message to the server
    //     if (sockets) {
    //         sockets.emit('sendMessage', messages[0]); // Send the message to the server
    //     }
    //   }, [sockets]);

    const onSend = useCallback(
        (messages = []) => {
            // Ensure the message contains the correct user ID and name
            const newMessage = {
                ...messages[0],
                user: {
                    _id: userId, // Use the current user's socket ID as their user ID
                    name: username, // Dynamically set the username
                },
            };

            // Emit the message to the server but do not append locally
            if (sockets) {
                sockets.emit('sendMessage', newMessage); // Send the message to the server
            }
        },
        [sockets, userId, username]
    );

    // Simple screen to set username
    const renderUsernameScreen = () => {
        return (
            <View style={{ padding: 20 }}>
                <TextInput
                    placeholder="Enter your name"
                    value={username}
                    onChangeText={setUsername}
                    style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
                />
                <Button
                    title="Start Chatting"
                    onPress={() => {
                        if (username.trim() !== '') {
                            setIsUsernameSet(true); // Set the flag to true if the user has entered a name
                        }
                    }}
                />
            </View>
        );
    };

    // Render the GiftedChat or username input screen
    return (
        <SafeAreaProvider>
            {!isUsernameSet ? (
                renderUsernameScreen() // Show username input screen if the username isn't set
            ) : (
                <GiftedChat
                    messages={messages}
                    onSend={(messages) => onSend(messages)}
                    user={{
                        _id: userId, // Set the current user's ID here
                        name: username, // The user's chosen name
                    }}
                />
            )}
        </SafeAreaProvider>
    );
};
export default ChatComponent

