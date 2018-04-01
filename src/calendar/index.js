import React, { Component } from 'react';
import { View, ViewPropTypes, Text } from 'react-native';
import PropTypes from 'prop-types';

import XDate from 'xdate';
import dateutils from '../dateutils';
import { xdateToData, parseDate } from '../interface';
import styleConstructor from './style';
import Day from './day/basic';
import UnitDay from './day/period';
import MultiDotDay from './day/multi-dot';
import CalendarHeader from './header';
import shouldComponentUpdate from './updater';

//Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;

const EmptyArray = [];

class Calendar extends Component {
  static propTypes = {
    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    // Collection of dates that have to be marked. Default = {}
    markedDates: PropTypes.object,

    dateHavePrice: PropTypes.any,

    // Specify style for calendar container element. Default = {}
    style: viewPropTypes.style,
    // Initially visible month. Default = Date()
    current: PropTypes.any,
    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
    minDate: PropTypes.any,
    // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
    maxDate: PropTypes.any,

    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
    firstDay: PropTypes.number,

    // Date marking style [simple/period]. Default = 'simple'
    markingType: PropTypes.string,

    // Hide month navigation arrows. Default = false
    hideArrows: PropTypes.bool,
    // Display loading indicador. Default = false
    displayLoadingIndicator: PropTypes.bool,
    // Do not show days of other months in month page. Default = false
    hideExtraDays: PropTypes.bool,

    // Handler which gets executed on day press. Default = undefined
    onDayPress: PropTypes.func,
    // Handler which gets executed when visible month changes in calendar. Default = undefined
    onMonthChange: PropTypes.func,
    onVisibleMonthsChange: PropTypes.func,
    // Replace default arrows with custom ones (direction can be 'left' or 'right')
    renderArrow: PropTypes.func,
    // Provide custom day rendering component
    dayComponent: PropTypes.any,
    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
    monthFormat: PropTypes.string,
    // Disables changing month when click on days of other months (when hideExtraDays is false). Default = false
    disableMonthChange: PropTypes.bool,
    //  Hide day names. Default = false
    hideDayNames: PropTypes.bool,
    // Disable days by default. Default = false
    disabledByDefault: PropTypes.bool,
    // Show week numbers. Default = false
    showWeekNumbers: PropTypes.bool,
    containerPriceStyle: PropTypes.any,
    textPriceStyle: PropTypes.any,
    showPrice: PropTypes.bool,
    holiday: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(this.props.theme);
    let currentMonth;
    if (props.current) {
      currentMonth = parseDate(props.current);
    } else {
      currentMonth = XDate();
    }
    this.state = {
      currentMonth
    };

    this.updateMonth = this.updateMonth.bind(this);
    this.addMonth = this.addMonth.bind(this);
    this.pressDay = this.pressDay.bind(this);
    this.shouldComponentUpdate = shouldComponentUpdate;
  }

  componentWillReceiveProps(nextProps) {
    const current = parseDate(nextProps.current);
    if (current && current.toString('yyyy MM') !== this.state.currentMonth.toString('yyyy MM')) {
      this.setState({
        currentMonth: current.clone()
      });
    }
  }

  updateMonth(day, doNotTriggerListeners) {
    if (day.toString('yyyy MM') === this.state.currentMonth.toString('yyyy MM')) {
      return;
    }
    this.setState(
      {
        currentMonth: day.clone()
      },
      () => {
        if (!doNotTriggerListeners) {
          const currMont = this.state.currentMonth.clone();
          if (this.props.onMonthChange) {
            this.props.onMonthChange(xdateToData(currMont));
          }
          if (this.props.onVisibleMonthsChange) {
            this.props.onVisibleMonthsChange([xdateToData(currMont)]);
          }
        }
      }
    );
  }

  pressDay(date) {
    const day = parseDate(date);
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    if (!(minDate && !dateutils.isGTE(day, minDate)) && !(maxDate && !dateutils.isLTE(day, maxDate))) {
      const shouldUpdateMonth = this.props.disableMonthChange === undefined || !this.props.disableMonthChange;
      if (shouldUpdateMonth) {
        this.updateMonth(day);
      }
      if (this.props.onDayPress) {
        this.props.onDayPress(xdateToData(day));
      }
    }
  }

  addMonth(count) {
    this.updateMonth(this.state.currentMonth.clone().addMonths(count, true));
  }

  renderDay(day, id) {
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    let state = '';
    if (this.props.disabledByDefault) {
      state = 'disabled';
    } else if ((minDate && !dateutils.isGTE(day, minDate)) || (maxDate && !dateutils.isLTE(day, maxDate))) {
      state = 'disabled';
    } else if (!dateutils.sameMonth(day, this.state.currentMonth)) {
      state = 'disabled';
    } else if (dateutils.sameDate(day, XDate())) {
      state = 'today';
    }
    let dayComp;
    if (!dateutils.sameMonth(day, this.state.currentMonth) && this.props.hideExtraDays) {
      if (this.props.markingType === 'period') {
        dayComp = <View key={id} style={{ flex: 1 }} />;
      } else {
        dayComp = <View key={id} style={{ width: 32 }} />;
      }
    } else {
      const DayComp = this.getDayComponent();
      const date = day.getDate();
      let price = '-';
      const tempday = day.getDate() <= 9 ? '0' + day.getDate() : day.getDate();
      const tempmonth = day.getMonth() + 1 <= 9 ? '0' + (day.getMonth() + 1) : day.getMonth() + 1;
      const tempyear = day.getFullYear();
      const allDate = tempday + '' + tempmonth + '' + tempyear;

      const tempdate = tempyear + '-' + tempmonth + '-' + tempday;
      const tempdateholiday = tempmonth + '/' + tempday + '/' + tempyear;

      let isHoliday = false;

      if (this.props.dateHavePrice[allDate]) {
        price = this.props.dateHavePrice[allDate];
      }

      if (this.props.holiday != null) {
        Object.keys(this.props.holiday).map((val, key) => {
          if (val.substr(0, 2) == this.state.currentMonth.toString('MM')) {
            if (val == tempdateholiday) {
              isHoliday = true;
            }
          }
        });
        // if (this.props.holiday[tempdateholiday]  ) {
        //   console.log(tempdateholiday, this.props.holiday[tempdateholiday]);
        // }
      }

      let disabled = new Date(tempdate) < new Date();

      if (disabled) {
        disabled = new Date(tempdate) == new Date();
      }

      dayComp = (
        <DayComp
          key={id}
          state={state}
          theme={this.props.theme}
          onPress={this.pressDay}
          date={xdateToData(day)}
          marking={this.getDateMarking(day)}
          price={price}
          containerPriceStyle={this.props.containerPriceStyle}
          textPriceStyle={this.props.textPriceStyle}
          showPrice={this.props.showPrice}
          disabled={disabled}
          isHoliday={isHoliday}
        >
          {date}
        </DayComp>
      );
    }
    return dayComp;
  }

  getDayComponent() {
    if (this.props.dayComponent) {
      return this.props.dayComponent;
    }

    switch (this.props.markingType) {
      case 'period':
        return UnitDay;
      case 'multi-dot':
        return MultiDotDay;
      default:
        return Day;
    }
  }

  getDateMarking(day) {
    if (!this.props.markedDates) {
      return false;
    }
    const dates = this.props.markedDates[day.toString('yyyy-MM-dd')] || EmptyArray;
    if (dates.length || dates) {
      return dates;
    } else {
      return false;
    }
  }

  renderWeekNumber(weekNumber) {
    return (
      <Day key={`week-${weekNumber}`} theme={this.props.theme} state="disabled">
        {weekNumber}
      </Day>
    );
  }

  renderWeek(days, id) {
    const week = [];
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2));
    }, this);

    if (this.props.showWeekNumbers) {
      week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
    }

    return (
      <View style={this.style.weekContainer} key={id}>
        <View style={this.style.week}>{week}</View>
      </View>
    );
  }

  renderHoliday(currentMonth) {
    const month = currentMonth.getMonth() + 1 <= 9 ? '0' + (currentMonth.getMonth() + 1) : currentMonth.getMonth() + 1;
    const text = [];
    if (this.props.holiday != null) {
      Object.keys(this.props.holiday).map((val, key) => {
        if (val.substr(0, 2) == month && val.substr(6, 4) == currentMonth.getFullYear()) {
          text.push(
            <View key={key} style={{ flexDirection: 'row', padding: 3 }}>
              <Text style={{ color: 'red' }}>{`${val.substr(3, 2)} : `}</Text>
              <Text> {`${this.props.holiday[val]}`} </Text>
            </View>
          );
        }
      });
    }

    return <View style={{ marginLeft: 10, marginTop: 10, borderTopWidth: 1, borderColor: 'black' }}>{text}</View>;
  }

  render() {
    const days = dateutils.page(this.state.currentMonth, this.props.firstDay);
    const weeks = [];
    while (days.length) {
      weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
    }
    let indicator;
    const current = parseDate(this.props.current);
    if (current) {
      const lastMonthOfDay = current
        .clone()
        .addMonths(1, true)
        .setDate(1)
        .addDays(-1)
        .toString('yyyy-MM-dd');
      if (this.props.displayLoadingIndicator && !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])) {
        indicator = true;
      }
    }
    return (
      <View style={[this.style.container, this.props.style]}>
        <CalendarHeader
          theme={this.props.theme}
          hideArrows={this.props.hideArrows}
          month={this.state.currentMonth}
          addMonth={this.addMonth}
          showIndicator={indicator}
          firstDay={this.props.firstDay}
          renderArrow={this.props.renderArrow}
          monthFormat={this.props.monthFormat}
          hideDayNames={this.props.hideDayNames}
          weekNumbers={this.props.showWeekNumbers}
        />
        {weeks}
        {this.renderHoliday(this.state.currentMonth)}
      </View>
    );
  }
}

export default Calendar;
