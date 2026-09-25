# AION Core v1.3
import logging

logging.basicConfig(level=logging.INFO, format='[AION] %(message)s')

class AIONCore:
    def __init__(self):
        self.name = "AION Core"
        self.version = "1.3"
        logging.info(f"{self.name} v{self.version} started")

    def execute(self, task):
        logging.info(f"Task received: {task}")
        return {"status": "OK", "task": task}

if __name__ == "__main__":
    aion = AIONCore()
    result = aion.execute({"type": "test", "query": "AION started"})
    print(result)