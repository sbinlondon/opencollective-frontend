import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';
import { groupBy, sortBy } from 'lodash';

import { CollectiveType } from '../lib/constants/collectives';
import StyledSelect from './StyledSelect';

const CollectiveTypesI18n = defineMessages({
  [CollectiveType.COLLECTIVE]: {
    id: 'collective.types.collective',
    defaultMessage: '{n, plural, one {collective} other {collectives}}',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'collective.types.organization',
    defaultMessage: '{n, plural, one {organization} other {organizations}}',
  },
  [CollectiveType.USER]: {
    id: 'collective.types.user',
    defaultMessage: '{n, plural, one {people} other {people}}',
  },
});

/** Returns options for `StyledSelect` */
const buildOptions = (collectives, groupByType, labelBuilder, intl) => {
  if (!collectives || collectives.length === 0) {
    return [];
  }

  // Function to generate a single select option
  const buildCollectiveOption = collective => {
    return { value: collective.id, label: labelBuilder(collective) };
  };

  // If not grouped, just sort the collectives by names and return their options
  if (!groupByType) {
    return sortBy(collectives, 'name').map(buildCollectiveOption);
  }

  // Group collectives under categories, sort the categories labels and the collectives inside them
  const collectivesByTypes = groupBy(collectives, 'type');
  const sortedActiveTypes = Object.keys(collectivesByTypes).sort();
  return sortedActiveTypes.map(type => {
    const sectionI18n = CollectiveTypesI18n[type];
    const sortedCollectives = sortBy(collectivesByTypes[type], 'name');
    const sectionLabel = sectionI18n ? intl.formatMessage(sectionI18n, { n: sortedCollectives.length }) : type;
    return {
      label: sectionLabel,
      options: sortedCollectives.map(buildCollectiveOption),
    };
  });
};

/**
 * An overset og `StyledSelect` specialized to display, filter and pick a collective from a given list.
 * Accepts all the props from [StyledSelect](#!/StyledSelect).
 *
 * If you want the collectives to be automatically loaded from the API, check `CollectivePickerAsync`.
 */
const CollectivePicker = ({ collectives, groupByType, labelBuilder, intl, ...props }) => {
  return <StyledSelect options={buildOptions(collectives, groupByType, labelBuilder, intl)} {...props} />;
};

CollectivePicker.propTypes = {
  /** The list of collectives to display */
  collectives: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      type: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  /** Function to generate a label from the collective + index */
  labelBuilder: PropTypes.func.isRequired,
  /** Whether we should group collectives by type */
  groupByType: PropTypes.bool,
  /** @ignore from injectIntl */
  intl: PropTypes.bool,
};

CollectivePicker.defaultProps = {
  groupByType: true,
  labelBuilder: collective => collective.name,
};

export default React.memo(injectIntl(CollectivePicker));
