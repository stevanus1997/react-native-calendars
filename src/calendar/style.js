import {StyleSheet} from 'react-native';
import * as defaultStyle from '../style';

const STYLESHEET_ID = 'stylesheet.calendar.main';

export default function getStyle(theme={}) {
  const appStyle = {...defaultStyle, ...theme};
  return StyleSheet.create({
    container: {
      paddingLeft: 5,
      paddingRight: 5,
      flex: 1,
      flexDirection:"column",
      backgroundColor: appStyle.calendarBackground
    },

    week: {
      marginTop: 7,
      marginBottom: 7,
      flexDirection: 'row',
    },

    day:{
      flex:1,
    },
    ...(theme[STYLESHEET_ID] || {})
  });
}