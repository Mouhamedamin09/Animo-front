import React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

export const Adsterra = () => {
    console.log('Adsterra Loaded');

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: 'https://www.profitablecpmrate.com/tyv9q4guiu?key=ae8041dca64053926b741f0ce3c2d9b2' }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onLoad={() => console.log('Ad Loaded')}
                onError={(error) => console.error('Ad Error:', error.nativeEvent)}
            />
        </View>


    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webview: {
        width: '100%',
        height: '100%', // Adjust height if needed
    },
});
