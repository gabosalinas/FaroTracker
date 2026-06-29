import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';

const videoSource = require('../../../assets/intro.mp4');

export default function IntroScreen({ navigation }) {
  const hasNavigated = useRef(false);
  const timeoutRef = useRef(null);

  const navigateToHub = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Stop the video player if possible to release resources
    try {
      player.pause();
    } catch (e) {
      // Ignore errors if player is not fully initialized or already released
    }

    navigation.replace('Hub');
  };

  const player = useVideoPlayer(videoSource, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.play();
  });

  useEventListener(player, 'playToEnd', () => {
    navigateToHub();
  });

  useEffect(() => {
    // Safety fallback: after 6 seconds, navigate to Hub if we haven't already.
    timeoutRef.current = setTimeout(() => {
      navigateToHub();
    }, 6000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <VideoView
        style={StyleSheet.absoluteFillObject}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
