import React from 'react';
import PropTypes from 'prop-types';
import { useLazyQuery } from 'react-apollo';
import { throttle } from 'lodash';
import { useIntl, defineMessages } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';
import CollectivePicker from './CollectivePicker';
import gql from 'graphql-tag';
import formatCollectiveType from '../lib/i18n-collective-type';

const DEFAULT_SEARCH_QUERY = gql`
  query SearchCollective($term: String!, $types: [TypeOfCollective], $limit: Int, $hostCollectiveIds: [Int]) {
    search(term: $term, types: $types, limit: $limit, hostCollectiveIds: $hostCollectiveIds, useAlgolia: false) {
      id
      collectives {
        id
        type
        slug
        name
        currency
        imageUrl(height: 64)
        hostFeePercent
      }
    }
  }
`;

/** Throttle search function to limit invocations while typing */
const throttledSearch = throttle((searchFunc, variables) => {
  return searchFunc({ variables });
}, 500);

const Messages = defineMessages({
  searchForType: {
    id: 'SearchFor',
    defaultMessage: 'Search for {entity}',
  },
  search: {
    id: 'Search',
    defaultMessage: 'Search',
  },
});

/**
 * If a single type is selected, will return a label like: `Search for users`
 * Otherwise it just returns `Search`
 */
const getPlaceholder = (formatMessage, types) => {
  if (types && types.length === 1) {
    return formatMessage(Messages.searchForType, {
      entity: formatCollectiveType(formatMessage, types[0], { count: 100 }),
    });
  } else {
    return formatMessage(Messages.search);
  }
};

/**
 * A specialization of `CollectivePicker` that fetches the data based on user search.
 */
const CollectivePickerAsync = ({ types, limit, hostCollectiveIds, preload, filterResults, searchQuery, ...props }) => {
  const [searchCollectives, { loading, data }] = useLazyQuery(searchQuery);
  const [term, setTerm] = React.useState(null);
  const { formatMessage } = useIntl();
  const collectives = (data && data.search && data.search.collectives) || [];
  const filteredCollectives = filterResults ? filterResults(collectives) : collectives;
  const placeholder = getPlaceholder(formatMessage, types);

  // If preload is true, trigger a first query on mount or when one of the query param changes
  React.useEffect(() => {
    if (term || preload) {
      throttledSearch(searchCollectives, { term, types, limit, hostCollectiveIds });
    }
  }, [types, limit, hostCollectiveIds, term]);

  return (
    <CollectivePicker
      isLoading={loading}
      collectives={filteredCollectives}
      groupByType={!types || types.length > 1}
      filterOption={() => true /** Filtering is done by the API */}
      sortFunc={collectives => collectives /** Already sorted by the API */}
      placeholder={placeholder}
      types={types}
      onInputChange={newTerm => {
        setTerm(newTerm.trim());
      }}
      {...props}
    />
  );
};

CollectivePickerAsync.propTypes = {
  /** The types of collectives to retrieve */
  types: PropTypes.arrayOf(PropTypes.oneOf(Object.values(CollectiveType))),
  /** Whether we should group collectives by type. By default, this is true when there's more than one type */
  groupByType: PropTypes.bool,
  /** Max number of collectives displayed at the same time */
  limit: PropTypes.number,
  /** If set, only the collectives under this host will be retrieved */
  hostCollectiveIds: PropTypes.arrayOf(PropTypes.number),
  /** If true, a query will be triggered even if search is empty */
  preload: PropTypes.bool,
  /** Query to use for the search. Override to add custom fields */
  searchQuery: PropTypes.any.isRequired,
  /** Function to filter results returned by the API */
  filterResults: PropTypes.func,
  /** If true, a permanent option to create a collective will be displayed in the select */
  creatable: PropTypes.bool,
};

CollectivePickerAsync.defaultProps = {
  preload: false,
  limit: 20,
  searchQuery: DEFAULT_SEARCH_QUERY,
};

export default CollectivePickerAsync;
