import gsap from "gsap";
import React, {
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
} from "react";
import he from "he";

import Logo from "../../assets/NMWA-logo.svg";
import "./ScreenOne.scss";

const ScreenOne = ({ data }) => {
  console.log(data);
  const [allDataSetKeys] = useState(["cumulative", "2023-donors"]);
  const [level, setLevel] = useState(0);
  const [dataSetKeyIndex, setDataSetKeyIndex] = useState(0);
  const datasetkey = allDataSetKeys[dataSetKeyIndex];
  const levelLength = data[datasetkey]["levels"].length;

  useLayoutEffect(() => {
    // Add a class to the body element when the component mounts
    document.body.classList.add("scr-mezzanine");

    // Remove the class when the component unmounts (optional)
    return () => {
      document.body.classList.remove("scr-mezzanine");
    };
  }, []);

  const onComplete = useCallback(() => {
    if (level === levelLength - 1) {
      setLevel(0);
      if (dataSetKeyIndex === allDataSetKeys.length - 1) {
        setDataSetKeyIndex(0);
      } else {
        setDataSetKeyIndex(dataSetKeyIndex + 1);
      }
    } else {
      setLevel(level + 1);
    }
  }, [level, levelLength, dataSetKeyIndex, allDataSetKeys.length]);

  // console.log('dataSetKeyIndex: ', dataSetKeyIndex, datasetkey, levelLength, 'level: ', level);

  return (
    <div className="app">
      <InfoColumn
        allDataSetKeys={allDataSetKeys}
        activeKeyIndex={dataSetKeyIndex}
        data={data}
        level={level}
      />
      <div className="auto-scroll-wrapper">
        <div className="dont-overflow">
          <AutoScrollingComponent
            key={datasetkey + "-" + level}
            startDelay={0}
            endDelay={2000}
            onComplete={onComplete}
            speed={150}
            fadeInOutDuration={1.5}
          >
            <div className="columns-container" id={datasetkey + "-" + level}>
              {renderHtml(data, datasetkey, level)}
            </div>
          </AutoScrollingComponent>
        </div>
      </div>
    </div>
  );
};

const AutoScrollingComponent = ({
  children,
  startDelay = 0,
  endDelay = 0,
  onComplete,
  speed = 1,
  fadeInOutDuration = 0.5,
}) => {
  const containerRef = useRef(null);
  useEffect(() => {
    const animationSpeed = speed;
    let columnHeight = containerRef.current.offsetHeight;
    columnHeight =
      columnHeight > window.innerHeight ? columnHeight : window.innerHeight;
    const finalY = -columnHeight + window.innerHeight;
    const bottomToTopDuration = (finalY * -1 * animationSpeed) / 10000;
    const isRightToLeft = finalY === 0;
    const startX = isRightToLeft ? 25 : 0;

    const context = gsap.context(() => {
      const tl = gsap.timeline({
        delay: startDelay / 1000,
        onComplete: () => {
          console.log("oncomplete");
          if (typeof onComplete === "function") {
            setTimeout(() => {
              onComplete();
            }, endDelay);
          }
        },
      });

      tl.to(containerRef.current, {
        duration: fadeInOutDuration,
        opacity: 1,
        ease: "none",
      });

      if (isRightToLeft) {
        tl.fromTo(
          containerRef.current,
          {
            y: "2rem",
            x: startX,
            duration: 1,
            ease: "linear",
            paused: false,
            opacity: 0,
          },
          {
            y: "2rem",
            x: 0,
            opacity: 1,
          }
        );
      } else {
        tl.from(containerRef.current, {
          y: "2rem",
        });
        tl.to(containerRef.current, {
          duration: bottomToTopDuration,
          y: finalY,
          ease: "linear",
          paused: false,
        });
      }

      tl.play();
    });

    return () => {
      context.revert();
    };
    // tl.play();
  }, [
    containerRef,
    startDelay,
    endDelay,
    onComplete,
    speed,
    fadeInOutDuration,
  ]);

  return (
    <div className="animation-container" ref={containerRef}>
      {children}
    </div>
  );
};

const InfoColumn = ({ allDataSetKeys, activeKeyIndex, data, level }) => {
  // console.log('InfoColumn: ', allDataSetKeys, activeKeyIndex, data, level)

  const getCampaignDescription = () => {
    const currentCampaignDesc = he.decode(
      data[allDataSetKeys[activeKeyIndex]]["campaignInfo"][0]["description"]
    );
    const descParts = currentCampaignDesc.split("|");

    const desc = descParts.join("<br />");

    return desc;
  };

  const getDsetsAndLevels = () => {
    return allDataSetKeys.map((dskey, index) => {
      const isActive = index === activeKeyIndex;
      const subDataSet = data[allDataSetKeys[index]];
      const campaignInfoData = subDataSet["campaignInfo"][0];
      const levelData = subDataSet["levels"][level];
      return (
        <div key={index} className={isActive ? "active" : ""}>
          <h2 className="set-title">
            {campaignInfoData["title"] ? campaignInfoData["title"] : ""}
          </h2>
          {isActive ? (
            <>
              <h3 className="level-title">
                {levelData["title"] ? levelData["title"] : ""}
              </h3>
              {/*<h4 className="level-desc">
                {levelData["description"] ? levelData["description"] : ""}
          </h4>*/}
            </>
          ) : null}
        </div>
      );
    });
  };

  return (
    <div className="column left-col">
      <h1 className="main-title">With Thanks</h1>
      <p
        className="main-desc"
        dangerouslySetInnerHTML={{
          __html: getCampaignDescription(),
        }}
      ></p>

      {getDsetsAndLevels()}

      {/*
        <div className="footer">
          <img src={Logo} alt="NMWA Logo" />
        </div>
      */}
    </div>
  );
};

const renderHtml = (data, datasetkey, level) => {
  // console.log('renderHtml:');
  const levelNames = data[datasetkey]["levels"][level]["names"];
  // console.log(
  //   "count of names: ",
  //   Object.keys(data[datasetkey]["levels"][level]["names"]).length
  // );
  const htmlContent = renderDataColumns(levelNames);
  return htmlContent;
};

const renderDataColumns = (names) => {
  const nameColumns = splitNamesIntoColumns(names);

  return nameColumns.map((column, index) => (
    <div key={index} className="column">
      {column.map((name, nameIndex) => (
        <div
          key={nameIndex}
          className="name"
          dangerouslySetInnerHTML={{ __html: name }}
        ></div>
      ))}
    </div>
  ));
};

const splitNamesIntoColumns = (data) => {
  // console.log('splitNamesIntoColumns:');
  const splitIntoColumns = (namesObject) => {
    const namesArray = namesObject.map((name) =>
      Array.isArray(name) ? name.join("<br />") : name
    );
    const totalNames = namesArray.length;
    const namesPerColumn = Math.ceil(totalNames / 3);
    const columns = [];
    for (let i = 0; i < totalNames; i += namesPerColumn) {
      const column = namesArray.slice(i, i + namesPerColumn);
      columns.push(column);
    }

    return columns;
  };
  const sortedNamesObjectKeys = Object.keys(data).sort();
  const sortedNamesArray = [];
  sortedNamesObjectKeys.forEach((key) => {
    sortedNamesArray.push(data[key]);
  });
  const allColumns = splitIntoColumns(sortedNamesArray);
  return allColumns;
};

export default ScreenOne;
