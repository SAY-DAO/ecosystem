/* eslint-disable react/no-unstable-nested-components */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Grid, Skeleton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { ResponsiveNetwork } from '@nivo/network';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { prepareUrl } from '../../utils/helpers';
import {
  childrenNetworkSelectors,
  fetchChildrenNetworks,
} from '../../features/childrenSlice';

// ---------- Helper: small, safe id sanitizer ----------
const safeId = (s) =>
  String(s)
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, '');

// ---------- Custom node component (memoized) ----------
function CustomPoint({ node, onNodeClick }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // small optimization: prepare fallback once per render
  const fallback = isDark ? '/images/logoDark.png' : '/images/logoLight.png';

  // keep the SVG structure simple: image element clipped by a circle
  const clipId = `clip_${safeId(node.id)}_${safeId(node.data?.theId ?? '')}`;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: node.id === 'Node 0' ? 'default' : 'pointer' }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r={node.size} cx="0" cy="0" />
        </clipPath>
      </defs>

      {/* draw image with clipPath (simpler than patterns and avoids complex paint ops) */}
      <image
        x={-node.size}
        y={-node.size}
        width={node.size * 2}
        height={node.size * 2}
        href={node.data?.img || fallback}
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clipId})`}
        onClick={(e) => onNodeClick(e, node)}
      />
      {/* subtle outline */}
      <circle
        r={node.size}
        fill="none"
        // stroke={node.color || '#767e89'}
        strokeWidth={Math.max(1, node.size * 0.06)}
        pointerEvents="none"
      />
    </g>
  );
}
CustomPoint.propTypes = {
  node: PropTypes.object.isRequired,
  onNodeClick: PropTypes.func.isRequired,
};
const MemoCustomPoint = React.memo(CustomPoint);

// ---------- Main component (optimized) ----------
function ChildrenFamilyNetwork() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedNodeId, setSelectedNodeId] = useState(null); // 'Node n'
  // cache family nodes per childId to avoid recalculation and re-preparing urls
  const familyCacheRef = useRef(new Map());

  const networks = useSelector((state) =>
    childrenNetworkSelectors.selectAll(state),
  );
  const networkStatus = useSelector((state) => state.childrenNetwork.status);

  // load networks on mount
  useEffect(() => {
    const action = dispatch(fetchChildrenNetworks());
    return () => {
      if (action?.abort) action.abort();
    };
  }, [dispatch]);

  // baseGraph derived once when networks/isDark/isMobile change
  const baseGraph = useMemo(() => {
    if (!networks || networks.length === 0) return null;

    const centerNode = {
      id: 'Node 0',
      size: 40,
      color: '#767e89',
      img: isDark ? '/images/logoDark.png' : '/images/logoLight.png',
      theId: 0,
      theIndex: -1,
      data: {},
    };

    const nodes = [centerNode];
    const links = [];

    for (let idx = 0; idx < networks.length; idx += 1) {
      const child = networks[idx];
      nodes.push({
        id: `Node ${idx + 1}`,
        size: 25,
        color: 'rgb(97, 205, 187)',
        img: prepareUrl(child.awakeAvatarUrl) || '/images/logo.png',
        theId: child.id,
        theIndex: idx,
        data: { raw: child },
        height: 0.05,
      });

      links.push({
        source: 'Node 0',
        target: `Node ${idx + 1}`,
        color: 'rgb(97, 205, 187)',
        distance: isMobile ? 60 : 120,
      });
    }

    return { nodes, links };
  }, [networks, isDark, isMobile]);

  // displayedGraph is base + optional family nodes (computed via memo so we don't clone arrays on every render)
  const displayedGraph = useMemo(() => {
    if (!baseGraph) return null;

    if (!selectedNodeId) {
      return baseGraph;
    }

    // quick safety: ensure selectedNodeId exists in base nodes
    const selected = baseGraph.nodes.find((n) => n.id === selectedNodeId);
    if (!selected) return baseGraph;

    // derive which child this node maps to
    const childIndex = selected.theIndex;
    const childRaw = networks[childIndex];
    if (
      !childRaw ||
      !childRaw.family ||
      !Array.isArray(childRaw.family.currentMembers)
    ) {
      return baseGraph;
    }

    // cached family nodes per child id
    const cached = familyCacheRef.current.get(childRaw.id);
    let familyNodes;
    let familyLinks;
    if (cached) {
      ({ familyNodes, familyLinks } = cached);
    } else {
      familyNodes = childRaw.family.currentMembers.map((m, idx) => {
        const user = m.user || {};
        return {
          id: `Node ch-${childRaw.id}${user.id}.0`,
          size: 10,
          color: '#767e89',
          img: user.avatarUrl
            ? prepareUrl(user.avatarUrl)
            : isDark
              ? '/images/userDark.svg'
              : '/images/userLight.svg',
          theId: (user.id || 0) * 10000 + idx,
          parentChildIndex: childIndex,
          data: { user, child: childRaw },
          height: 0.05,
        };
      });

      familyLinks = familyNodes.map((fn) => ({
        source: selectedNodeId,
        target: fn.id,
        distance: isMobile ? 10 : 30,
      }));

      familyCacheRef.current.set(childRaw.id, { familyNodes, familyLinks });
    }

    return {
      nodes: [...baseGraph.nodes, ...familyNodes],
      links: [...baseGraph.links, ...familyLinks],
    };
  }, [baseGraph, selectedNodeId, networks, isDark, isMobile]);

  // single stable click handler (immutable updates handled by changing selectedNodeId only)
  const handleNodeClick = useCallback((e, node) => {
    if (!node || node.id === 'Node 0') return;

    const isFamilyMember = String(node.id).includes('.');

    if (!isFamilyMember) {
      // toggle selection: selectedNodeId is single source of truth for expanded family
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
      return;
    }

    // family member clicked -> do whatever side-effect (open profile, navigate)
    const user = node.data?.user || node.data;
    // eslint-disable-next-line no-console
    console.log('Family member clicked', user);
  }, []);

  // pick a random child once when the graph first loads (simulates a click on load)
  const didRandomSelectRef = useRef(false);
  useEffect(() => {
    if (didRandomSelectRef.current) return; // only once per component lifecycle
    if (!baseGraph) return;

    // exclude the center node (theIndex < 0) and ensure there is at least one child
    const childNodes = baseGraph.nodes.filter((n) => Number(n.theIndex) >= 0);
    if (childNodes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * childNodes.length);
    const randomNode = childNodes[randomIndex];

    setSelectedNodeId(randomNode.id);
    didRandomSelectRef.current = true;
  }, [baseGraph]);
  // render
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      sx={{ overflow: 'auto' }}
    >
      {networkStatus !== 'loading' && displayedGraph ? (
        <div
          style={{
            minWidth: isMobile ? '150%' : '100%',
            minHeight: '90vh',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.22) transparent',
          }}
        >
          <ResponsiveNetwork
            animate
            data={displayedGraph}
            nodeComponent={(props) => (
              <MemoCustomPoint {...props} onNodeClick={handleNodeClick} />
            )}
            centeringStrength={0.3}
            // linkBlendMode="multiply"
            margin={{ top: 0, right: 10, bottom: 10, left: 10 }}
            linkDistance={(l) => l.distance}
            repulsivity={isMobile ? 60 : 150}
            nodeSize={(n) => n.size}
            activeNodeSize={(n) => 1.5 * n.size}
            nodeColor={(n) => n.color}
            nodeBorderWidth={1}
            nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            linkThickness={(t) => 2 + 2 * t.target.data.height}
          />
        </div>
      ) : (
        <Skeleton sx={{ width: '100%', height: '80vh' }} />
      )}
    </Grid>
  );
}

export default ChildrenFamilyNetwork;
