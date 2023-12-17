export interface ProgressStep {
  from: number;
  to: number;
  size: number;
  parent?: ProgressStep;
  next?: ProgressStep;
}

export class ProgressLogger {
  private progress: number = 0;
  private currentStep: ProgressStep = null;
  private loggerFn: (progress: number, message: string) => void = () => {};

  public defineSteps(steps: Partial<Omit<ProgressStep, 'children' | 'parent'>>[]) {
    try {
      const { from, to } = this.currentStep || { from: 0, to: 100 };
      const currentStepSize = to - from;
      const stageSteps = steps.map((item, i) => ({
        ...item,
        to: item.to ?? from + (currentStepSize / steps.length) * i + currentStepSize / steps.length,
        from: item.from ?? from + (currentStepSize / steps.length) * i,
        parent: this.currentStep,
      })) as ProgressStep[];
      stageSteps.forEach((item, i, array) => {
        item.next = i < array.length - 1 ? array[i + 1] : this.currentStep?.next ?? null;
      });
      this.currentStep = stageSteps[0];
    } catch (error) {
      console.log(error);
    }
  }

  public setLoggerFn(fn: (progress: number, message: string) => void) {
    this.loggerFn = fn;
  }

  public info(message: string) {
    this.loggerFn(this.progress, message);
  }

  public finishStep() {
    try {
      if (this.currentStep?.next) {
        this.currentStep = this.currentStep.next;
        this.progress = this.currentStep.from;
      } else {
        this.currentStep = null;
        this.progress = 100;
      }
    } catch (error) {
      console.log(error);
    }
  }

  public doStep() {
    try {
      const stepSize = this.currentStep.to - this.currentStep.from;
      this.progress += stepSize / (this.currentStep.size ?? 1);
      if (this.progress > this.currentStep.to) {
        this.progress = this.currentStep.to;
      }
    } catch (error) {
      console.log(error);
    }
  }

  public doInfoStep(message: string) {
    this.info(message);
    this.doStep();
  }

  public finishInfoStep(message: string) {
    this.finishStep();
    this.info(message);
  }
}
