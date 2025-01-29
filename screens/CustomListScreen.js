// screens/CustomListScreen.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Layout from '../Layouts/Layout';

// Import the custom tab component
import CustomListTab from '../components/CustomListTab';

const Tab = createMaterialTopTabNavigator();

const CustomListScreen = () => {
  return (
    <Layout>
      <Tab.Navigator
        initialRouteName="Watching"
        screenOptions={{
          // Enable scrolling if tabs exceed the screen width
          tabBarScrollEnabled: true,
          
          // Active tab label color
          tabBarActiveTintColor: '#fff',
          
          // Inactive tab label color
          tabBarInactiveTintColor: '#a1a1aa',
          
          // Label styling
          tabBarLabelStyle: { 
            fontSize: 14, 
            fontWeight: 'bold',
            paddingHorizontal: 16, // Adds horizontal padding to each label
          },
          
          // Tab bar styling
          tabBarStyle: { 
            backgroundColor: '#262626',
            elevation: 0, // Removes shadow on Android
            shadowOpacity: 0, // Removes shadow on iOS
          },
          
          // Indicator styling
          tabBarIndicatorStyle: { 
            backgroundColor: '#5abf75',
            height: 4, // Thicker indicator for better visibility
            borderRadius: 2,
          },
          
          // Individual tab item styling
          tabBarItemStyle: { 
            width: 'auto', // Allows tab width to adjust based on content
            paddingVertical: 8, // Adds vertical padding for better touch area
            marginHorizontal: 4, // Adds horizontal margin between tabs
          },
        }}
      >
        {/* 1. Watching */}
        <Tab.Screen
          name="Watching"
          children={() => (
            <CustomListTab 
              tabLabel="Watching" 
              status="watching_now" 
            />
          )}
        />

        {/* 2. Plan to Watch */}
        <Tab.Screen
          name="PlanToWatch"
          children={() => (
            <CustomListTab
              tabLabel="Plan to Watch"
              status="want_to_watch"
            />
          )}
        />

        {/* 3. Completed */}
        <Tab.Screen
          name="Completed"
          children={() => (
            <CustomListTab
              tabLabel="Completed"
              status="done_watching"
            />
          )}
        />

        {/* 4. Dropped */}
        <Tab.Screen
          name="Dropped"
          children={() => (
            <CustomListTab
              tabLabel="Dropped"
              status="complete_later"
            />
          )}
        />

        {/* 5. Not Interested */}
        <Tab.Screen
          name="NotInterested"
          children={() => (
            <CustomListTab
              tabLabel="Not Interested"
              status="dont_want"
            />
          )}
        />
      </Tab.Navigator>
    </Layout>
  );
};

export default CustomListScreen;
