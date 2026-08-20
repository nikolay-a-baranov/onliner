export const createSnapshot = () => {
  const snapshot = {
    run() {
      window.alert("Снэпшот: модуль подключен. Сбор snapshot-артефакта будет реализован следующим этапом.");
      return true;
    },
  };
  return { snapshot };
};
