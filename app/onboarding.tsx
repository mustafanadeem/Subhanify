import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useRef, useState, useEffect } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Notification animation state
  const [currentNotif, setCurrentNotif] = useState(1);
  const notifOpacity = useRef(new Animated.Value(1)).current;
  const notifTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    
    const animateNotifications = () => {
      if (!isMounted) return;
      
      // Fade out and slide down
      Animated.parallel([
        Animated.timing(notifOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(notifTranslateY, {
          toValue: 30,
          duration: 500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (!isMounted) return;
        
        // Switch notification
        setCurrentNotif((prev) => (prev === 1 ? 2 : 1));
        
        // Reset position to slide in from top
        notifTranslateY.setValue(-30);
        
        // Fade in and slide to center
        Animated.parallel([
          Animated.timing(notifOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(notifTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isMounted) {
            // Sync with bell animation - repeat every 2 seconds
            setTimeout(animateNotifications, 2000);
          }
        });
      });
    };

    // Start the animation cycle after 2 seconds (synced with bell)
    const timeout = setTimeout(animateNotifications, 2000);
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const handleContinue = () => {
    if (currentPage < 2) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      
      // Scroll to next page
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * nextPage,
        animated: true,
      });
    } else {
      router.push("/(tabs)");
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={["#001322", "#0634A9"]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {/* Page 1 Content */}
          <View style={styles.page}>
            <View style={styles.content}>
              {/* Top Text Section */}
              <View style={styles.textSection}>
                <Text style={styles.welcomeText}>Welcome to</Text>
                <Text style={styles.brandText}>Subhanify</Text>

                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>
                    Remember Allah Anywhere.
                  </Text>
                </View>
              </View>

              {/* Middle Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={require("@/assets/images/onboarding-pic.png")}
                  style={styles.onboardingImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Bottom Section with Button */}
            <View style={styles.bottomSection}>
              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, currentPage === 0 ? styles.dotActive : styles.dotInactive]} />
                <View style={[styles.dot, currentPage === 1 ? styles.dotActive : styles.dotInactive]} />
                <View style={[styles.dot, currentPage === 2 ? styles.dotActive : styles.dotInactive]} />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.whiteButton]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Page 2 Content */}
          <View style={styles.page}>
            <View style={styles.content}>
              <View style={styles.page2TextSection}>
                <Text style={styles.page2Title}>
                  Allow location to tailor your adhkars
                </Text>
                <Text style={styles.page2Subtitle}>
                  Personalised to your daily routine.
                </Text>
              </View>

              {/* Lottie Animation for Location */}
              <View style={styles.page2AnimationContainer}>
                <LottieView
                  source={require("@/assets/animation/location.json")}
                  style={styles.lottieAnimation}
                  autoPlay
                  loop
                />
              </View>
            </View>

            {/* Bottom Section with Button */}
            <View style={styles.bottomSection}>
              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, currentPage === 0 ? styles.dotActive : styles.dotInactive]} />
                <View style={[styles.dot, currentPage === 1 ? styles.dotActive : styles.dotInactive]} />
                <View style={[styles.dot, currentPage === 2 ? styles.dotActive : styles.dotInactive]} />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.whiteButton]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Page 3 Content */}
          <View style={styles.page}>
            <View style={styles.content}>
              <View style={styles.page2TextSection}>
                <Text style={styles.page2Title}>
                  Be notified when you should read your adhkars
                </Text>
                <Text style={styles.page2Subtitle}>
                  Personalised to your daily routine.
                </Text>
              </View>

              {/* Animated Notification */}
              <View style={styles.page3IllustrationContainer}>
                <Animated.View
                  style={[
                    styles.notificationWrapper,
                    {
                      opacity: notifOpacity,
                      transform: [{ translateY: notifTranslateY }],
                    },
                  ]}
                >
                  <Image
                    source={
                      currentNotif === 1
                        ? require("@/assets/images/notif1.png")
                        : require("@/assets/images/notif2.png")
                    }
                    style={styles.notificationImage}
                    contentFit="contain"
                  />
                </Animated.View>
              </View>

              {/* Bell Lottie Animation */}
              <View style={styles.page3BellContainer}>
                <LottieView
                  source={require("@/assets/animation/bell.json")}
                  style={styles.bellAnimation}
                  autoPlay
                  loop
                />
              </View>
            </View>

            {/* Bottom Section with Button */}
            <View style={styles.bottomSection}>
              {/* Progress Dots */}
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, currentPage === 0 ? styles.dotActive : styles.dotInactive]} />
                <View style={[styles.dot, currentPage === 1 ? styles.dotActive : styles.dotInactive]} />
                <View style={[styles.dot, currentPage === 2 ? styles.dotActive : styles.dotInactive]} />
              </View>

              <TouchableOpacity
                style={[styles.button, styles.whiteButton]}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  background: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  animatedContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  textSection: {
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: "400",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  brandText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#60C5F1",
    marginBottom: 32,
    letterSpacing: -1,
    fontFamily: "PolySans-Bulky",
  },
  descriptionContainer: {
    gap: 4,
  },
  descriptionText: {
    fontSize: 32,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  underlined: {
    textDecorationLine: "underline",
    fontWeight: "700",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 20,
    width: SCREEN_WIDTH * 1.2,
    marginLeft: -32 - (SCREEN_WIDTH * 0.1),
  },
  onboardingImage: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_HEIGHT * 0.4,
  },
  // Shared bottom section
  bottomSection: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  button: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  whiteButton: {
    backgroundColor: "#FFFFFF",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    letterSpacing: 0.5,
  },
  // Page 2 specific styles
  page2TextSection: {
    marginTop: 20,
  },
  page2Title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    lineHeight: 48,
  },
  page2Subtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 40,
  },
  page2ImagePlaceholder: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  page2AnimationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 0,
    marginBottom: 20,
  },
  lottieAnimation: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
  },
  placeholderText: {
    fontSize: 20,
    color: "#FFFFFF",
    opacity: 0.5,
  },
  // Page 3 specific styles
  page3IllustrationContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
    marginBottom: 20,
  },
  notificationWrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationImage: {
    width: "100%",
    height: "100%",
  },
  page3BellContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bellAnimation: {
    width: 280,
    height: 280,
  },
});
