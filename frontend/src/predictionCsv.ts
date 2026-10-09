type PredictionCsvResult = {
  modelVersion: string;
  predictions: Array<{
    rowIndex: number;
    label: string;
    probabilities: { Kecimen: number; Besni: number };
  }>;
};

export function predictionCsv(result: PredictionCsvResult) {
  return ['row,label,p_Kecimen,p_Besni,model_version', ...result.predictions.map(prediction =>
    `${prediction.rowIndex + 1},${prediction.label},${prediction.probabilities.Kecimen},${prediction.probabilities.Besni},${result.modelVersion}`
  )].join('\r\n');
}
