import { propertiesContainsFilter } from "@turf/clusters";
import * as React from "react";
import { titleCase } from "../../utils/utils";
import { Filter } from "../../svg-icons";
import {
  StatsSection,
  StatsHeader,
  Description,
  Disclaimer,
  StatsGrid,
  StatsGridItem,
  StyledStat,
  StatsSubtitle,
} from "./styles";

interface BoundaryStatsProps {
  currentState: any;
  updateParent: any;
  name: string;
  stats_key?: string;
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
  stats_key,
  description,
  heading,
  stats,
  type,
}: BoundaryStatsProps) => {
  const lookupKey =
    stats_key && stats?.neighborhood_stats?.[stats_key] ? stats_key : name;
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
    const neighStats = stats.neighborhood_stats?.[lookupKey];
    let result = {
      mostCommonSpecies: { treeName: "", count: 0 },
      numSpecies: 0,
      total_trees: neighStats?.total_count ?? 0,
      area_sqkm: neighStats?.area_sqkm as number | undefined,
      tree_density_sqkm: neighStats?.tree_density_sqkm as number | undefined,
    };
    if (!neighStats) {
      return result;
    }
    for (const [key, value] of Object.entries(stats.tree_stats)) {
      //@ts-ignore
      if (lookupKey in value.neighborhood_counts) {
        result.numSpecies++;
        //@ts-ignore
        if (result.mostCommonSpecies.count < value.neighborhood_counts[lookupKey]) {
          result.mostCommonSpecies.treeName = key;
          //@ts-ignore
          result.mostCommonSpecies.count = value.neighborhood_counts[lookupKey];
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

  const displayStats = React.useMemo(() => getStats(), [name, stats_key, stats]);

  const mostCommonSubtitle = () => {
    let result;
    if (displayStats === null)
        return

    if (type === "neighborhood") {
      const totalCount = stats.neighborhood_stats?.[lookupKey]?.total_count;
      result = totalCount
        ? ` ${Math.round(
            (displayStats.mostCommonSpecies.count / totalCount) * 100
          ).toFixed(0)}% `
        : " 0% ";
    } else if (type === "city") {
      result = ` ${Math.round(
        (displayStats.mostCommonSpecies.count / stats.city_tree_count) * 100
      ).toFixed(0)}% `;
    }

    return result;
  };

  let parsedDescription: string[] = [];
  if (Array.isArray(description)) {
    parsedDescription = description;
  } else if (typeof description === "string" && description.trim()) {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed)) parsedDescription = parsed;
    } catch {
      parsedDescription = [description];
    }
  }
  let blurb = [];
  for (let i = 0; i < parsedDescription.length; i++) {
    blurb.push(<Description key={i}>{parsedDescription[i]}</Description>);
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
      {type === "city" && (
        <Disclaimer>
          This is an unofficial project and is not affiliated with the City of
          Vancouver. To report a tree concern or request tree maintenance,
          contact{" "}
          <a
            href="https://van311.ca/services/city-and-park-trees-maintenance"
            target="_blank"
            rel="noopener noreferrer"
          >
            Van311
          </a>{" "}
          or use the Van311 app.
        </Disclaimer>
      )}
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
            {(displayStats as any).area_sqkm != null && (
              <StatsGridItem>
                <StyledStat>{((displayStats as any).area_sqkm as number).toFixed(2)} km²</StyledStat>
                <StatsSubtitle>Area</StatsSubtitle>
              </StatsGridItem>
            )}
            {(displayStats as any).tree_density_sqkm != null && (
              <StatsGridItem>
                <StyledStat>{((displayStats as any).tree_density_sqkm as number).toFixed(1)}</StyledStat>
                <StatsSubtitle>Trees per km²</StatsSubtitle>
              </StatsGridItem>
            )}
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
