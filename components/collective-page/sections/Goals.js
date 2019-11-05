import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

import LoadingPlaceholder from '../../LoadingPlaceholder';
import Container from '../../Container';

// Dynamicly load HTMLEditor to download it only if user can edit the page
const GoalsCoverLoadingPlaceholder = () => <LoadingPlaceholder height={400} />;
const GoalsCover = dynamic(() => import('../../GoalsCover'), {
  loading: GoalsCoverLoadingPlaceholder,
});

/**
 * Display the general goals for the collective
 */
const SectionAbout = ({ collective }) => {
  return (
    <Container background="rgb(245, 247, 250)" pt={5} pb={40}>
      <GoalsCover collective={collective} />
    </Container>
  );
};

SectionAbout.propTypes = {
  /** The collective to display description for */
  collective: PropTypes.shape({
    settings: PropTypes.object,
  }).isRequired,
};

export default React.memo(SectionAbout);
