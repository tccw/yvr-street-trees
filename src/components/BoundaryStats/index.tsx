import { propertiesContainsFilter } from "@turf/clusters";
import * as React from "react";
import { titleCase } from "../../utils/utils";
import { Filter } from "../../svg-icons";
import {
  StatsSection,
  StatsHeader,
  Description,
  StatsGrid,
  StatsGridItem,
  StyledStat,
  StatsSubtitle,
} from "./styles";

interface BoundaryStatsProps {
  currentState: any;
  updateParent: any;
  name: string;
  description: string;
  heading: string;
  stats: any;
  type: string;
}

/** type: 'city' | 'neighborhood' */
const BoundaryStats = ({
  currentState,
  updateParent,
  name,
  description,
  heading,
  stats,
  type,
}: BoundaryStatsProps) => {
  name = name && name.toUpperCase();
  const getStats = () => {
    let displayStats = null;
    if (stats) {
      if (type === "neighborhood") {
        displayStats = getNeighborhoodStats();
      } else if (type === "city") {
        displayStats = getCitywideStats();
      }
    }

    return displayStats;
  };

  const getNeighborhoodStats = () => {
    let result = {
      mostCommonSpecies: { treeName: "", count: -1 },
      numSpecies: 0,
      total_trees: stats.neighborhood_stats[name].total_count,
    };
    for (const [key, value] of Object.entries(stats.tree_stats)) {
      //@ts-ignore
      if (name in value.neighborhood_counts) {
        result.numSpecies++;
        //@ts-ignore
        if (result.mostCommonSpecies.count < value.neighborhood_counts[name]) {
          result.mostCommonSpecies.treeName = key;
          //@ts-ignore
          result.mostCommonSpecies.count = value.neighborhood_counts[name];
        }
      }
    }
    return result;
  };

  const getCitywideStats = () => {
    /** TODO: numSpecies is hardcoded now since the counts would be cultivars, not species.
     * This should be addressed later in the stats file generation (or calculated onLoad)
     */
    // Object.keys(stats.tree_stats).length
    let result = {
      mostCommonSpecies: { treeName: "", count: -1 },
      numSpecies: 363,
      total_trees: stats.city_tree_count,
    };

    for (const [key, value] of Object.entries(stats.tree_stats)) {
      //@ts-ignore
      if (result.mostCommonSpecies.count < value.total_count) {
        result.mostCommonSpecies.treeName = key;
        //@ts-ignore
        result.mostCommonSpecies.count = value.total_count;
      }
    }

    return result;
  };

  const displayStats = React.useMemo(() => getStats(), [name, stats]);

  const mostCommonSubtitle = () => {
    let result;
    if (displayStats === null)
        return

    if (type === "neighborhood") {
      result = ` ${Math.round(
        (displayStats.mostCommonSpecies.count /
          stats.neighborhood_stats[name].total_count) *
          100
      ).toFixed(0)}% `;
    } else if (type === "city") {
      result = ` ${Math.round(
        (displayStats.mostCommonSpecies.count / stats.city_tree_count) * 100
      ).toFixed(0)}% `;
    }

    return result;
  };

  description = JSON.parse(description);
  let blurb = [];
  for (let i = 0; i < description.length; i++) {
    blurb.push(<Description key={i}>{description[i]}</Description>);
  }

  const handleClick = () => {
    if (displayStats) {
      //@ts-ignore
      updateParent({
        ...currentState,
        trees: [displayStats.mostCommonSpecies.treeName],
      });
    }
  };

  // this component may be re-rendering too often
  return (
    <StatsSection>
      {blurb}
      {displayStats && (
        <>
          <StatsHeader> {`${heading} Statistics`} </StatsHeader>
          <StatsGrid>
            <StatsGridItem>
              <StyledStat>
                {displayStats.total_trees.toLocaleString()}
              </StyledStat>
              <StatsSubtitle>Mapped Trees</StatsSubtitle>
            </StatsGridItem>
            <StatsGridItem>
              <StyledStat>{displayStats.numSpecies}</StyledStat>
              <StatsSubtitle>Total Species</StatsSubtitle>
            </StatsGridItem>
            <StatsGridItem style={{ gridColumn: "span 2" }}>
              <StyledStat onClick={handleClick} style={{ cursor: "pointer" }}>
                {titleCase(displayStats.mostCommonSpecies.treeName)}
                {Filter({ height: 15, width: 15 })}
              </StyledStat>
              <div>
                <StatsSubtitle>Most Common Species</StatsSubtitle>
                <br></br>
                <StatsSubtitle weight="regular" fontSize={0.9}>
                  <StatsSubtitle
                    color="darkgreen"
                    weight="regular"
                    fontSize={0.9}
                  >{`${displayStats.mostCommonSpecies.count.toLocaleString()} `}</StatsSubtitle>
                  trees,
                  <StatsSubtitle
                    color="darkgreen"
                    weight="regular"
                    fontSize={0.9}
                  >
                    {mostCommonSubtitle()}
                  </StatsSubtitle>
                  of mapped {<b>{titleCase(name)}</b>} trees.
                </StatsSubtitle>
              </div>
            </StatsGridItem>
          </StatsGrid>
        </>
      )}
    </StatsSection>
  );
};

export default React.memo(BoundaryStats);
