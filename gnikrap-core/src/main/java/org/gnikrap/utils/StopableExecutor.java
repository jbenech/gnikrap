/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2014 Jean BENECH
 * 
 * Gnikrap is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Gnikrap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Gnikrap.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.gnikrap.utils;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.FutureTask;
import java.util.concurrent.RunnableFuture;
import java.util.concurrent.locks.ReentrantLock;

/**
 * TODO: Rewrite in a better way.
 * 
 * Don't use an standard {@link ExecutorService} because we can't force the thread to stop. <br/>
 * Forcing the thread to stop is not a good thing see {@link Thread#stop()}, but I don't find a better way to do the job in this case (eg. needed to stop a script execution that is in an infinite
 * loop) <br/>
 * No thread reuse (a new Thread is created each time).
 */
public class StopableExecutor implements Executor {

  private final ReentrantLock mainLock = new ReentrantLock();
  private Thread worker;

  @Override
  public void execute(Runnable command) {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
      if (worker != null) {
        stop();
      }
      worker = new Thread(command);
      worker.start();
    } finally {
      mainLock.unlock();
    }
  }

  public Future<?> submit(Runnable command) {
    RunnableFuture<?> result = new FutureTask<Void>(command, null);
    execute(result);
    return result;
  }

  /**
   * Force the underlying thread to stop.
   */
  @SuppressWarnings("deprecation")
  public void stop() {
    final ReentrantLock mainLock = this.mainLock;
    mainLock.lock();
    try {
      try {
        if (worker.isAlive()) {
          worker.stop();
        }
      } finally {
        worker = null;
      }
    } finally {
      mainLock.unlock();
    }
  }
}
