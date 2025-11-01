import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faSlidersH,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import "./AssociationSettings.scss";

const AssociationSettings = ({ settings, onSettingsChange }) => {
  return (
    <div className="settings-tab-panel">
      <div className="panel-header">
        <h3>Association Rules & Recommendations</h3>
        <p>Configure parameters for product recommendation algorithms</p>
      </div>

      <div className="settings-table">
        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">
              <FontAwesomeIcon icon={faChartLine} className="setting-icon" />
              Minimum Support Threshold
            </label>
            <span className="setting-description">
              Minimum frequency of itemset occurrence in transactions (1% - 30%)
            </span>
          </div>
          <div className="setting-control">
            <div className="slider-control">
              <input
                type="range"
                value={settings.minSupport}
                onChange={(e) =>
                  onSettingsChange("minSupport", parseFloat(e.target.value))
                }
                className="setting-slider"
                min="0.01"
                max="0.3"
                step="0.01"
              />
              <span className="slider-value">
                {(settings.minSupport * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">
              <FontAwesomeIcon icon={faSlidersH} className="setting-icon" />
              Minimum Confidence Threshold
            </label>
            <span className="setting-description">
              Minimum probability that consequent items are bought when
              antecedent items are purchased (10% - 80%)
            </span>
          </div>
          <div className="setting-control">
            <div className="slider-control">
              <input
                type="range"
                value={settings.minConfidence}
                onChange={(e) =>
                  onSettingsChange("minConfidence", parseFloat(e.target.value))
                }
                className="setting-slider"
                min="0.1"
                max="0.8"
                step="0.05"
              />
              <span className="slider-value">
                {(settings.minConfidence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="settings-row">
          <div className="setting-info">
            <label className="setting-name">
              <FontAwesomeIcon icon={faArrowTrendUp} className="setting-icon" />
              Minimum Lift Threshold
            </label>
            <span className="setting-description">
              Minimum lift value indicating association strength (0.5 - 3.0)
            </span>
          </div>
          <div className="setting-control">
            <div className="slider-control">
              <input
                type="range"
                value={settings.minLift}
                onChange={(e) =>
                  onSettingsChange("minLift", parseFloat(e.target.value))
                }
                className="setting-slider"
                min="0.5"
                max="3.0"
                step="0.1"
              />
              <span className="slider-value">
                {settings.minLift.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociationSettings;
